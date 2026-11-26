
import express from 'express';
import { randomUUID } from 'node:crypto';
import realtimeDB from '../config/firebase.js';

const router = express.Router();

const ALLOWED_SERVOS = [
  'servo1',
  'servo2',
  'servo3',
  'servo4',
  'servo5',
  'servo6'
];

const ALLOWED_OPERATIONS = [
  'dryerTimer',
  'temperatureControl'
];

const DEFAULT_STATE = {
  settings: {
    timerDuration: 60,
    targetTemperature: 30
  },
  operations: {
    dryerTimer: {
      active: false,
      startedAt: null,
      endsAt: null,
      runId: null
    },
    temperatureControl: {
      active: false,
      startedAt: null,
      endsAt: null,
      runId: null
    }
  }
};

// ==========================================
// GET SENSOR DATA
// GET /api/iot/sensors
// ==========================================
router.get('/sensors', async (req, res, next) => {
  try {
    const snapshot = await realtimeDB.ref('/sensors').once('value');

    res.status(200).json({
      success: true,
      connected: true,
      data: snapshot.val() || {
        temperature: null,
        humidity: null
      }
    });
  } catch (error) {
    next(error);
  }
});

// ==========================================
// GET ALL SERVO ANGLES
// GET /api/iot/servos
// ==========================================
router.get('/servos', async (req, res, next) => {
  try {
    const snapshot = await realtimeDB.ref('/servos').once('value');

    res.status(200).json({
      success: true,
      data: snapshot.val() || {}
    });
  } catch (error) {
    next(error);
  }
});

// ==========================================
// UPDATE ONE SERVO
// POST /api/iot/servos/:servoId
// ==========================================
router.post('/servos/:servoId', async (req, res, next) => {
  try {
    const { servoId } = req.params;
    const { angle } = req.body;

    if (!ALLOWED_SERVOS.includes(servoId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid servo ID'
      });
    }

    if (
      angle === undefined ||
      angle === null ||
      angle === '' ||
      !Number.isFinite(Number(angle)) ||
      Number(angle) < 0 ||
      Number(angle) > 180
    ) {
      return res.status(400).json({
        success: false,
        message: 'Angle must be a number between 0 and 180'
      });
    }

    const servoAngle = Math.round(Number(angle));

    await realtimeDB.ref(`/servos/${servoId}`).set(servoAngle);

    return res.status(200).json({
      success: true,
      message: `${servoId} updated successfully`,
      data: {
        servoId,
        angle: servoAngle
      }
    });
  } catch (error) {
    next(error);
  }
});

// ==========================================
// UPDATE MULTIPLE SERVOS
// POST /api/iot/servos
// ==========================================
router.post('/servos', async (req, res, next) => {
  try {
    const updates = {};

    for (const servoId of ALLOWED_SERVOS) {
      if (req.body[servoId] === undefined) continue;

      const rawAngle = req.body[servoId];
      const angle = Number(rawAngle);

      if (
        rawAngle === null ||
        rawAngle === '' ||
        !Number.isFinite(angle) ||
        angle < 0 ||
        angle > 180
      ) {
        return res.status(400).json({
          success: false,
          message: `Invalid angle for ${servoId}. Use 0 to 180.`
        });
      }

      updates[servoId] = Math.round(angle);
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No servo angles provided'
      });
    }

    await realtimeDB.ref('/servos').update(updates);

    return res.status(200).json({
      success: true,
      message: 'Servo angles updated successfully',
      data: updates
    });
  } catch (error) {
    next(error);
  }
});

// ==========================================
// GET SAVED IOT STATE
// GET /api/iot/state
// ==========================================
router.get('/state', async (req, res, next) => {
  try {
    const snapshot = await realtimeDB.ref('/iotState').once('value');
    const savedState = snapshot.val() || {};

    const state = {
      settings: {
        ...DEFAULT_STATE.settings,
        ...(savedState.settings || {})
      },
      operations: {
        ...DEFAULT_STATE.operations,
        ...(savedState.operations || {})
      }
    };

    // Mark expired dryer timers as inactive.
    const dryer = state.operations.dryerTimer;

    if (
      dryer.active &&
      dryer.endsAt &&
      Number(dryer.endsAt) <= Date.now()
    ) {
      await realtimeDB.ref('/iotState/operations/dryerTimer').update({
        active: false,
        endedAt: Date.now()
      });

      dryer.active = false;
    }

    return res.status(200).json({
      success: true,
      data: state
    });
  } catch (error) {
    next(error);
  }
});

// ==========================================
// SAVE IOT SETTINGS
// PATCH /api/iot/state
// Body: { timerDuration, targetTemperature }
// ==========================================
router.patch('/state', async (req, res, next) => {
  try {
    const updates = {};
    const { timerDuration, targetTemperature } = req.body;

    if (timerDuration !== undefined) {
      const value = Number(timerDuration);

      if (
        !Number.isInteger(value) ||
        value < 30 ||
        value > 86400
      ) {
        return res.status(400).json({
          success: false,
          message: 'Timer duration must be between 30 and 86400 seconds.'
        });
      }

      updates.timerDuration = value;
    }

    if (targetTemperature !== undefined) {
      const value = Number(targetTemperature);

      if (
        !Number.isFinite(value) ||
        value < 0 ||
        value > 100
      ) {
        return res.status(400).json({
          success: false,
          message: 'Target temperature must be between 0 and 100.'
        });
      }

      updates.targetTemperature = value;
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No valid settings provided.'
      });
    }

    await realtimeDB.ref('/iotState/settings').update(updates);

    const snapshot = await realtimeDB.ref('/iotState').once('value');

    return res.status(200).json({
      success: true,
      message: 'IoT settings saved.',
      data: snapshot.val()
    });
  } catch (error) {
    next(error);
  }
});

// ==========================================
// START OPERATION - PREVENT DUPLICATES
// POST /api/iot/operations/:operation/start
// Body: { durationSeconds } for dryerTimer
// ==========================================
router.post('/operations/:operation/start', async (req, res, next) => {
  try {
    const { operation } = req.params;

    if (!ALLOWED_OPERATIONS.includes(operation)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid operation.'
      });
    }

    const now = Date.now();
    let durationSeconds = null;

    if (operation === 'dryerTimer') {
      durationSeconds = Number(req.body.durationSeconds);

      if (
        !Number.isInteger(durationSeconds) ||
        durationSeconds < 30 ||
        durationSeconds > 86400
      ) {
        return res.status(400).json({
          success: false,
          message: 'A valid durationSeconds value is required.'
        });
      }
    }

    const operationRef = realtimeDB.ref(
      `/iotState/operations/${operation}`
    );

    const result = await operationRef.transaction((current) => {
      const existing = current || {};

      // Do not allow another active run.
      const stillActive =
        existing.active === true &&
        (!existing.endsAt || Number(existing.endsAt) > now);

      if (stillActive) {
        return; // Abort transaction.
      }

      return {
        active: true,
        startedAt: now,
        endsAt: durationSeconds
          ? now + durationSeconds * 1000
          : null,
        runId: randomUUID()
      };
    }, undefined, false);

    if (!result.committed) {
      return res.status(409).json({
        success: false,
        message: 'This operation is already running. Duplicate start blocked.',
        data: result.snapshot.val()
      });
    }

    return res.status(200).json({
      success: true,
      message: `${operation} started.`,
      data: result.snapshot.val()
    });
  } catch (error) {
    next(error);
  }
});

// ==========================================
// STOP OPERATION
// POST /api/iot/operations/:operation/stop
// ==========================================
router.post('/operations/:operation/stop', async (req, res, next) => {
  try {
    const { operation } = req.params;

    if (!ALLOWED_OPERATIONS.includes(operation)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid operation.'
      });
    }

    const operationRef = realtimeDB.ref(
      `/iotState/operations/${operation}`
    );

    const result = await operationRef.transaction((current) => {
      if (!current || current.active !== true) {
        return current || {
          active: false,
          startedAt: null,
          endsAt: null,
          runId: null
        };
      }

      return {
        ...current,
        active: false,
        endedAt: Date.now()
      };
    }, undefined, false);

    return res.status(200).json({
      success: true,
      message: `${operation} stopped.`,
      data: result.snapshot.val()
    });
  } catch (error) {
    next(error);
  }
});

export default router;
