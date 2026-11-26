
<template>
  <div class="dashboard">
    <header class="dashboard-header">
      <div>
        <p class="eyebrow">IOT MONITORING SYSTEM</p>
        <h1>Dashboard</h1>
        <p class="subtitle">Monitor your sensors and control your devices.</p>
      </div>

      <div class="connection" :class="{ online: isConnected }">
        <span class="connection-dot"></span>
        {{ isConnected ? 'Connected' : 'Disconnected' }}
      </div>
    </header>

    <section class="sensor-grid">
      <article class="sensor-card">
        <div class="card-top">
          <div class="sensor-icon temperature-icon">🌡️</div>
          <span class="sensor-label">TEMPERATURE</span>
        </div>
        <h2>{{ temperatureDisplay }}<small v-if="temperature !== null">°C</small></h2>
        <p class="sensor-description">DHT22 temperature reading</p>
        <div class="progress-track">
          <div class="progress-fill temperature-fill"
            :style="{ width: `${temperatureProgress}%` }"></div>
        </div>
        <div class="sensor-footer">
          <span>Current temperature</span>
          <strong :class="sensorStatusClass(temperatureStatus)">
            {{ temperatureStatus }}
          </strong>
        </div>
      </article>

      <article class="sensor-card">
        <div class="card-top">
          <div class="sensor-icon humidity-icon">💧</div>
          <span class="sensor-label">HUMIDITY</span>
        </div>
        <h2>{{ humidityDisplay }}<small v-if="humidity !== null">%</small></h2>
        <p class="sensor-description">DHT22 humidity reading</p>
        <div class="progress-track">
          <div class="progress-fill humidity-fill"
            :style="{ width: `${humidityProgress}%` }"></div>
        </div>
        <div class="sensor-footer">
          <span>Current humidity</span>
          <strong :class="sensorStatusClass(humidityStatus)">
            {{ humidityStatus }}
          </strong>
        </div>
      </article>
    </section>

    <section class="servo-section">
      <div class="section-heading">
        <div>
          <p class="eyebrow">DEVICE CONTROL</p>
          <h2>IoT Devices</h2>
          <p class="section-description">Control and manage your connected devices.</p>
        </div>
        <span class="device-status">4 DISPLAYED CONTROLS · 6 HARDWARE SERVOS</span>
      </div>

      <div class="servo-grid">
        <!-- SERVO 1 -->
        <article class="servo-card power-card">
          <div class="power-card-header">
            <div>
              <p class="eyebrow">SMART DEVICE</p>
              <h3>IoT Device 1</h3>
            </div>
            <span class="power-status" :class="{ 'power-on': servo1Active }">
              {{ servo1Active ? 'ON' : 'OFF' }}
            </span>
          </div>

          <button class="power-control"
            :class="{ 'power-active': servo1Active }"
            :disabled="servo1Loading || stateLoading"
            @click="toggleServo1">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
              stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M12 2v10" />
              <path d="M6.2 5.6a9 9 0 1 0 11.6 0" />
            </svg>
          </button>

          <h2 class="power-label" :class="{ 'power-label-on': servo1Active }">
            {{ servo1Active ? 'POWER ON' : 'POWER OFF' }}
          </h2>
          <p class="power-description">
            Each click moves Servo 1 from 180° to 0°, then back to 180°.
          </p>
          <p v-if="servo1Loading" class="movement-message">Moving servo...</p>
          <p v-if="servo1Error" class="error-message">{{ servo1Error }}</p>
        </article>

        <!-- SERVO 2 LIGHT CONTROL -->
        <article class="servo-card power-card">
          <div class="power-card-header">
            <div>
              <p class="eyebrow">SMART LIGHT</p>
              <h3>Light Control</h3>
            </div>
            <span class="power-status" :class="{ 'power-on': servo2LightActive }">
              {{ servo2LightActive ? 'ON' : 'OFF' }}
            </span>
          </div>

          <button class="power-control"
            :class="{ 'power-active': servo2LightActive }"
            :disabled="servo2LightLoading || dryerLoading || timerLoading || timerCycleActive || stateLoading"
            :aria-label="servo2LightActive ? 'Turn light off' : 'Turn light on'"
            @click="toggleServo2Light">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
              stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M9 18h6" />
              <path d="M10 22h4" />
              <path d="M8.5 14.5a7 7 0 1 1 7 0c-.8.6-1.2 1.4-1.4 2.5h-4.2c-.2-1.1-.6-1.9-1.4-2.5Z" />
            </svg>
          </button>

          <h2 class="power-label" :class="{ 'power-label-on': servo2LightActive }">
            {{ servo2LightLoading ? 'PLEASE WAIT...' : servo2LightActive ? 'LIGHT ON' : 'LIGHT OFF' }}
          </h2>
          <p class="power-description">
            Each click toggles the light status and moves Servo 2 from 0° to 180°, then back to 0°.
          </p>
          <p v-if="servo2LightLoading" class="movement-message">Moving Servo 2...</p>
          <p v-if="servo2LightError" class="error-message">{{ servo2LightError }}</p>
        </article>


        <!-- SERVO 3 TIMER SETTINGS -->
        <article class="servo-card timer-card">
          <div class="timer-header">
            <div class="servo-information">
              <div class="timer-icon">⚙️</div>
              <div>
                <h3>Timer Settings</h3>
                <p>Physical Servo 3</p>
              </div>
            </div>
            <span class="timer-status" :class="{ 'timer-status-running': timerArmed }">
              {{ timerCycleActive ? 'RUNNING' : timerArmed ? 'READY' : 'SET TIME' }}
            </span>
          </div>

          <div class="timer-display">
            <div class="timer-count">{{ formattedTime }}</div>
            <span class="timer-caption">
              {{ timerCycleActive ? 'TIME REMAINING' : timerArmed ? 'READY TO START' : 'DRYING DURATION' }}
            </span>
          </div>

          <div class="timer-adjustment">
            <button class="adjust-button minus-button"
              :disabled="!timerArmed || timerCycleActive || timerLoading || servo5Adjusting || servo6Adjusting"
              @click="decreaseTimer">−</button>
            <div class="adjustment-label">
              <strong>±30 min</strong>
              <span>Range: 00:30–24:00</span>
            </div>
            <button class="adjust-button plus-button"
              :disabled="!timerArmed || timerCycleActive || timerLoading || servo5Adjusting || servo6Adjusting"
              @click="increaseTimer">+</button>
          </div>

          <div class="timer-buttons">
            <button class="timer-button start-timer-button"
              :disabled="timerLoading || timerCycleActive || dryerLoading || stateLoading"
              @click="setDryerTimer">
              {{ timerLoading ? 'PLEASE WAIT...' : '⚙ SET TIME' }}
            </button>
          </div>

          <p class="timer-instruction">
            {{ timerCycleActive ? 'Timer is counting down.' : timerArmed ? 'Adjust the duration or click SET TIME again.' : 'Press SET TIME to enable the duration controls.' }}
          </p>
          <p v-if="timerMessage" class="timer-message">{{ timerMessage }}</p>
          <p v-if="timerError" class="error-message">{{ timerError }}</p>
        </article>

        <!-- SERVO 4 TEMPERATURE CONTROLLER -->
        <article class="servo-card temperature-controller">
          <div class="servo-information">
            <div class="servo-icon temperature-controller-icon">🌡️</div>
            <div>
              <h3>Temperature Controller</h3>
              <p>Physical Servo 4</p>
            </div>
          </div>

          <div class="temperature-display">
            <span class="temperature-number">{{ targetTemperature }}°C</span>
            <span class="angle-label">TARGET TEMPERATURE</span>
          </div>

          <div class="current-temperature">
            <span>Current DHT22 temperature</span>
            <strong>{{ temperatureDisplay }}{{ temperature !== null ? '°C' : '' }}</strong>
          </div>

          <div class="temperature-adjustment">
            <button class="adjust-button minus-button"
              :disabled="!servo4.active || servo4.loading || temperatureLoading || servo5Adjusting || servo6Adjusting || targetTemperature <= MIN_TARGET_TEMPERATURE"
              @click="decreaseTemperature">−</button>
            <div class="adjustment-label">
              <strong>{{ targetTemperature }}°C</strong>
              <span>±5°C · Range 30–90°C</span>
            </div>
            <button class="adjust-button plus-button"
              :disabled="!servo4.active || servo4.loading || temperatureLoading || servo5Adjusting || servo6Adjusting || targetTemperature >= MAX_TARGET_TEMPERATURE"
              @click="increaseTemperature">+</button>
          </div>

          <div class="temperature-progress-track">
            <div class="temperature-progress-fill"
              :style="{ width: `${targetTemperature / MAX_TARGET_TEMPERATURE * 100}%` }"></div>
          </div>

          <button class="servo-button start-button"
            :disabled="servo4.loading || temperatureLoading || stateLoading"
            @click="toggleServo4">
            {{ servo4.loading ? 'PLEASE WAIT...' : 'SET TEMPERATURE' }}
          </button>

          <p class="servo-instruction">
            {{ servo4.active ? 'Adjust your target temperature, then click SET TEMPERATURE to apply.' : 'Click SET TEMPERATURE to enable temperature adjustment.' }}
          </p>
          <p v-if="temperatureMessage" class="timer-message">{{ temperatureMessage }}</p>
          <p v-if="servo4.error" class="error-message">{{ servo4.error }}</p>
        </article>
      </div>
    </section>

    <footer class="dashboard-footer">
      <div>
        <span class="updated-label">Last updated</span>
        <strong>{{ lastUpdated || 'Waiting for sensor data...' }}</strong>
      </div>
      <button class="refresh-button" :disabled="refreshing || stateLoading" @click="refreshDashboard">
        {{ refreshing || stateLoading ? 'Refreshing...' : '↻ Refresh' }}
      </button>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';

const API_BASE = 'http://localhost:5000/api/iot';
const SENSOR_API = `${API_BASE}/sensors`;
const SERVO_API = `${API_BASE}/servos`;
const STATE_API = `${API_BASE}/state`;

interface OperationState {
  active: boolean;
  startedAt: number | null;
  endsAt: number | null;
  runId: string | null;
}

interface IoTState {
  settings?: {
    timerDuration?: number;
    targetTemperature?: number;
  };
  operations?: {
    dryerTimer?: OperationState;
    temperatureControl?: OperationState;
  };
}

interface ServoControl {
  id: number;
  angle: number;
  targetAngle: number;
  active: boolean;
  loading: boolean;
  error: string;
}

const temperature = ref<number | null>(null);
const humidity = ref<number | null>(null);
const sensorState = ref<'checking' | 'online' | 'offline'>('checking');
const isConnected = ref(false);
const refreshing = ref(false);
const lastUpdated = ref('');
const stateLoading = ref(false);

// Restore the previous Servo 1 status after refreshing.
const servo1Active = ref(
  localStorage.getItem('servo1Active') === 'true'
);

// Automatically save every ON/OFF status change.
watch(servo1Active, (newValue) => {
  localStorage.setItem('servo1Active', String(newValue));
});

const servo1Loading = ref(false);
const servo1Error = ref('');

const servo2LightActive = ref(
  localStorage.getItem('servo2LightActive') === 'true'
);
const servo2LightLoading = ref(false);
const servo2LightError = ref('');

watch(servo2LightActive, (newValue) => {
  localStorage.setItem('servo2LightActive', String(newValue));
});

const dryerLoading = ref(false);

const TIMER_STEP = 30 * 60;
const MIN_TIMER_DURATION = 30 * 60;
const MAX_TIMER_DURATION = 24 * 60 * 60;

const timerDuration = ref(30 * 60);
const timerRemaining = ref(30 * 60);
const timerArmed = ref(false);
const timerCycleActive = ref(false);
const timerLoading = ref(false);
const timerError = ref('');
const timerMessage = ref('');

let timerInterval: ReturnType<typeof setInterval> | null = null;
let timerRunId = 0;
let timerEndTime = 0;

const servo5Adjusting = ref(false);
const servo6Adjusting = ref(false);

const MIN_TARGET_TEMPERATURE = 30;
const MAX_TARGET_TEMPERATURE = 90;
const TEMPERATURE_STEP = 5;

const targetTemperature = ref(60);
const temperatureLoading = ref(false);
const temperatureMessage = ref('');

const servo4 = ref<ServoControl>({
  id: 4,
  angle: 90,
  targetAngle: 0,
  active: false,
  loading: false,
  error: ''
});

const servo5 = ref<ServoControl>({
  id: 5,
  angle: 90,
  targetAngle: 0,
  active: false,
  loading: false,
  error: ''
});

const servo6 = ref<ServoControl>({
  id: 6,
  angle: 0,
  targetAngle: 180,
  active: false,
  loading: false,
  error: ''
});

const formatTimerDuration = (seconds: number) => {
  const totalMinutes = Math.ceil(seconds / 60);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
};

const formattedTime = computed(() => formatTimerDuration(
  timerCycleActive.value ? timerRemaining.value : timerDuration.value
));

const formattedDuration = computed(() => {
  return formatTimerDuration(timerDuration.value);
});

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

const temperatureDisplay = computed(() =>
  temperature.value === null ? '—' : temperature.value.toFixed(1)
);
const humidityDisplay = computed(() =>
  humidity.value === null ? '—' : humidity.value.toFixed(1)
);
const temperatureProgress = computed(() =>
  clamp((temperature.value ?? 0) / 50 * 100, 0, 100)
);
const humidityProgress = computed(() =>
  clamp(humidity.value ?? 0, 0, 100)
);
const temperatureStatus = computed(() => {
  const value = temperature.value;
  if (sensorState.value === 'offline') return 'Offline';
  if (sensorState.value !== 'online') return 'Checking';
  if (value === null) return 'Failed';
  return value >= 35 ? 'High' : 'Normal';
});
const humidityStatus = computed(() => {
  const value = humidity.value;
  if (sensorState.value === 'offline') return 'Offline';
  if (sensorState.value !== 'online') return 'Checking';
  if (value === null) return 'Failed';
  return value >= 70 ? 'High' : 'Normal';
});
const sensorStatusClass = (status: string) => ({
  'sensor-status-warning': status === 'High',
  'sensor-status-error': status === 'Offline' || status === 'Failed'
});

const apiRequest = async (url: string, options: RequestInit = {}) => {
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers
    }
  });

  let result: any = {};
  try {
    result = await response.json();
  } catch {
    // Some endpoints may return an empty response.
  }

  if (!response.ok || result.success === false) {
    throw new Error(result.message || `Request failed: ${response.status}`);
  }

  return result;
};

const postOperation = (
  operation: 'dryerTimer' | 'temperatureControl',
  action: 'start' | 'stop',
  body: Record<string, unknown> = {}
) => apiRequest(`${API_BASE}/operations/${operation}/${action}`, {
  method: 'POST',
  body: JSON.stringify(body)
});

const moveServo = (servoId: number, angle: number) =>
  apiRequest(`${SERVO_API}/servo${servoId}`, {
    method: 'POST',
    body: JSON.stringify({ angle })
  });

const delay = (milliseconds: number) =>
  new Promise(resolve => setTimeout(resolve, milliseconds));

const moveAdjustmentServo = async (servo: ServoControl, targetAngle: number) => {
  if (servo.id === 5 || servo.id === 6) {
    await moveServo(servo.id, 0);
    servo.angle = 0;
    await delay(500);
  }

  await moveServo(servo.id, targetAngle);
  servo.angle = targetAngle;
  await delay(500);
};

const saveSettings = () => apiRequest(STATE_API, {
  method: 'PATCH',
  body: JSON.stringify({
    timerDuration: timerDuration.value,
    targetTemperature: targetTemperature.value
  })
});

const fetchSensors = async () => {
  refreshing.value = true;
  try {
    const result = await apiRequest(SENSOR_API);
    const data = result.data ?? result ?? {};
    const tempValue = data.temperature ?? data.temp ?? data.dht22?.temperature;
    const humidityValue = data.humidity ?? data.hum ?? data.dht22?.humidity;
    const parsedTemperature = tempValue === null || tempValue === undefined || tempValue === ''
      ? null
      : Number(tempValue);
    const parsedHumidity = humidityValue === null || humidityValue === undefined || humidityValue === ''
      ? null
      : Number(humidityValue);
    const validTemperature = parsedTemperature !== null &&
      Number.isFinite(parsedTemperature) &&
      parsedTemperature >= -40 &&
      parsedTemperature <= 80;
    const validHumidity = parsedHumidity !== null &&
      Number.isFinite(parsedHumidity) &&
      parsedHumidity >= 0 &&
      parsedHumidity <= 100;

    temperature.value = validTemperature ? parsedTemperature : null;
    humidity.value = validHumidity ? parsedHumidity : null;

    isConnected.value = true;
    lastUpdated.value = new Date().toLocaleTimeString();
    sensorState.value = 'online';
  } catch (error) {
    console.error('Sensor error:', error);
    isConnected.value = false;
    sensorState.value = 'offline';
    temperature.value = null;
    humidity.value = null;
  } finally {
    refreshing.value = false;
  }
};

const clearTimerInterval = () => {
  if (timerInterval !== null) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
};

/*
 * SERVO 2 MOVEMENT
 * Every button click moves Servo 2:
 * 0° -> 180° -> 0°
 */
const pulseServo2 = async () => {
  dryerLoading.value = true;

  try {
    await moveServo(2, 0);
    await delay(1000);
    await moveServo(2, 180);
    await delay(1000);
    await moveServo(2, 0);
  } finally {
    dryerLoading.value = false;
  }
};

const toggleServo2Light = async () => {
  if (servo2LightLoading.value || dryerLoading.value || timerLoading.value ||
      timerCycleActive.value || stateLoading.value) return;

  servo2LightLoading.value = true;
  servo2LightError.value = '';

  try {
    await pulseServo2();
    servo2LightActive.value = !servo2LightActive.value;
  } catch (error) {
    servo2LightError.value = error instanceof Error
      ? error.message
      : 'Unable to move Servo 2 for the light.';
  } finally {
    servo2LightLoading.value = false;
  }
};

const updateCountdown = (runId: number) => {
  if (runId !== timerRunId || !timerCycleActive.value) return;

  const secondsLeft = Math.max(0, Math.ceil((timerEndTime - Date.now()) / 1000));
  timerRemaining.value = secondsLeft;

  if (secondsLeft <= 0) {
    clearTimerInterval();
    void finishDryerTimer(runId);
  }
};

const restoreTimer = async (operation?: OperationState) => {
  clearTimerInterval();

  if (!operation || operation.active !== true || !operation.endsAt) {
    timerCycleActive.value = false;
    timerArmed.value = false;
    timerRemaining.value = timerDuration.value;

    // Keep Servo 2 at its default position when no timer is active.
    try {
      await moveServo(2, 0);
    } catch (error) {
      console.error('Unable to restore Servo 2 default position:', error);
    }
    return;
  }

  const rawEndTime = operation.endsAt;
  const parsedEndTime = typeof rawEndTime === 'number'
    ? rawEndTime
    : Number.isFinite(Number(rawEndTime))
      ? Number(rawEndTime)
      : Date.parse(String(rawEndTime ?? ''));

  const savedEndTime = parsedEndTime > 0 && parsedEndTime < 100000000000
    ? parsedEndTime * 1000
    : parsedEndTime;

  if (!Number.isFinite(savedEndTime) || savedEndTime <= Date.now()) {
    try {
      await postOperation('dryerTimer', 'stop');
      await moveServo(2, 0);
    } catch (error) {
      console.error('Unable to clear expired timer:', error);
    }
    timerCycleActive.value = false;
    timerArmed.value = false;
    timerRemaining.value = timerDuration.value;
    return;
  }

  // Restore an active timer without opening Servo 2.
  try {
    await moveServo(2, 0);
  } catch (error) {
    console.error('Unable to restore Servo 2 default position:', error);
    timerError.value = 'Timer is active, but Servo 2 could not be set to 0°.';
  }

  timerRunId++;
  const currentRun = timerRunId;
  timerEndTime = savedEndTime;
  timerCycleActive.value = true;
  timerArmed.value = false;
  timerMessage.value = 'Restored active timer from saved dashboard state.';
  updateCountdown(currentRun);

  if (timerCycleActive.value && currentRun === timerRunId) {
    timerInterval = setInterval(() => updateCountdown(currentRun), 250);
  }
};

const loadDashboardState = async () => {
  stateLoading.value = true;
  try {
    const result = await apiRequest(STATE_API);
    const state = (result.data ?? result) as IoTState;

    const savedDuration = Number(state.settings?.timerDuration);
    const savedTarget = Number(state.settings?.targetTemperature);

    if (Number.isInteger(savedDuration) &&
        savedDuration >= MIN_TIMER_DURATION &&
        savedDuration <= MAX_TIMER_DURATION) {
      timerDuration.value = savedDuration;
      timerRemaining.value = savedDuration;
    }

    if (Number.isFinite(savedTarget) &&
        savedTarget >= MIN_TARGET_TEMPERATURE &&
        savedTarget <= MAX_TARGET_TEMPERATURE) {
      targetTemperature.value = savedTarget;
    }

    servo4.value.active = state.operations?.temperatureControl?.active === true;
    await restoreTimer(state.operations?.dryerTimer);
  } catch (error) {
    console.error('Unable to load saved IoT state:', error);
    timerError.value = error instanceof Error
      ? `Unable to restore dashboard state: ${error.message}`
      : 'Unable to restore dashboard state.';
  } finally {
    stateLoading.value = false;
  }
};

// SERVO 1: 180° → 0° → 180°
const toggleServo1 = async () => {
  if (servo1Loading.value || stateLoading.value) return;

  servo1Loading.value = true;
  servo1Error.value = '';

  const nextState = !servo1Active.value;

  try {
    await moveServo(1, 180); // Start at 180°
    await delay(1000);       // Wait 1 second
    await moveServo(1, 0);   // Move to 0°
    await delay(1000);       // Hold for 1 second
    await moveServo(1, 180); // Return to 180°

    servo1Active.value = nextState;
  } catch (error) {
    servo1Error.value = error instanceof Error
      ? error.message
      : 'Servo 1 movement failed.';

    try {
      await moveServo(1, 180);
    } catch (returnError) {
      servo1Error.value += ' Unable to return to 180 degrees.';
      console.error(returnError);
    }
  } finally {
    servo1Loading.value = false;
  }
};

// Servo 3: 0° -> 180° -> 0°
const pulseServo3 = async () => {
  let movementError: unknown = null;

  try {
    await moveServo(3, 0);
    await delay(1000);
    await moveServo(3, 180);
    await delay(1000);
  } catch (error) {
    movementError = error;
  }

  try {
    await moveServo(3, 0);
  } catch (error) {
    movementError = error;
  }

  if (movementError) throw movementError;
};

const setDryerTimer = async () => {
  if (timerLoading.value || timerCycleActive.value) return;

  timerLoading.value = true;
  timerError.value = '';
  timerMessage.value = 'Moving Servo 3 to set the timer...';

  try {
    await pulseServo3();
    timerArmed.value = true;
    timerCycleActive.value = false;
    timerRemaining.value = timerDuration.value;
    timerMessage.value = 'Servo 3 returned to 0°. Adjust your desired time.';
  } catch (error) {
    timerArmed.value = false;
    timerError.value = error instanceof Error
      ? error.message
      : 'Unable to set timer.';
    timerMessage.value = '';
  } finally {
    timerLoading.value = false;
  }
};

const finishDryerTimer = async (runId: number) => {
  if (runId !== timerRunId) return;

  clearTimerInterval();
  timerCycleActive.value = false;
  timerLoading.value = true;
  timerRemaining.value = 0;

  try {
    await postOperation('dryerTimer', 'stop');

    // Timer completed: keep Servo 2 at its default position.
    await moveServo(2, 0);

    timerMessage.value = 'Timer completed. Servo 2 returned to 0°.';
  } catch (error) {
    timerError.value = error instanceof Error
      ? error.message
      : 'Unable to finish timer.';
  } finally {
    if (runId === timerRunId) {
      timerArmed.value = false;
      timerRemaining.value = timerDuration.value;
      timerLoading.value = false;
    }
  }
};

const startDryerTimer = async () => {
  if (timerLoading.value || timerCycleActive.value ||
      dryerLoading.value || servo2LightLoading.value || stateLoading.value) return;

  timerRunId++;
  const currentRun = timerRunId;
  timerLoading.value = true;
  timerError.value = '';
  timerMessage.value = 'Starting timer...';
  timerRemaining.value = timerDuration.value;

  let backendStarted = false;

  try {
    const result = await postOperation('dryerTimer', 'start', {
      durationSeconds: timerDuration.value
    });
    backendStarted = true;

    const rawEndTime = result.data?.endsAt;
    const parsedEndTime = typeof rawEndTime === 'number'
      ? rawEndTime
      : Number.isFinite(Number(rawEndTime))
        ? Number(rawEndTime)
        : Date.parse(String(rawEndTime ?? ''));

    const savedEndTime = parsedEndTime > 0 && parsedEndTime < 100000000000
      ? parsedEndTime * 1000
      : parsedEndTime;

    if (!Number.isFinite(savedEndTime) || savedEndTime <= Date.now()) {
      throw new Error('Backend did not return a valid future timer end time.');
    }

    timerEndTime = savedEndTime;
    await saveSettings();

    // START TIMER: Servo 2 moves 0° -> 180° -> 0°.
    // The countdown continues after Servo 2 returns to 0°.
    await pulseServo2();

    if (currentRun !== timerRunId) return;

    timerArmed.value = false;
    timerCycleActive.value = true;
    timerMessage.value =
      'Servo 2 completed its movement and returned to 0°. Timer is running.';
    timerLoading.value = false;

    updateCountdown(currentRun);

    if (currentRun === timerRunId && timerCycleActive.value) {
      timerInterval = setInterval(() => updateCountdown(currentRun), 250);
    }
  } catch (error) {
    if (currentRun !== timerRunId) return;

    timerError.value = error instanceof Error
      ? error.message
      : 'Timer start error.';

    timerMessage.value = '';
    timerCycleActive.value = false;
    timerArmed.value = false;
    timerRemaining.value = timerDuration.value;

    if (backendStarted) {
      try {
        await postOperation('dryerTimer', 'stop');
      } catch (stopError) {
        console.error('Unable to release timer operation:', stopError);
      }
    }

    try {
      await moveServo(2, 0);
    } catch (closeError) {
      timerError.value += closeError instanceof Error
        ? ` | Servo 2 return to 0° failed: ${closeError.message}`
        : ' | Servo 2 return to 0° failed.';
    }
  } finally {
    if (currentRun === timerRunId) {
      timerLoading.value = false;
    }
  }
};

const stopDryerTimer = async () => {
  if (timerLoading.value) return;

  timerRunId++;
  clearTimerInterval();
  timerCycleActive.value = false;
  timerLoading.value = true;
  timerError.value = '';
  timerMessage.value = 'Stopping timer...';

  try {
    await postOperation('dryerTimer', 'stop');

    // STOP: Servo 2 moves 0° -> 180° -> 0°.
    await pulseServo2();

    timerMessage.value = 'Timer stopped. Servo 2 returned to 0°.';
  } catch (error) {
    timerError.value = error instanceof Error
      ? error.message
      : 'Unable to stop timer or move Servo 2.';

    // Make a final attempt to return Servo 2 to 0°.
    try {
      await moveServo(2, 0);
    } catch (returnError) {
      timerError.value += returnError instanceof Error
        ? ` | Servo 2 return failed: ${returnError.message}`
        : ' | Servo 2 return failed.';
    }
  } finally {
    timerRemaining.value = timerDuration.value;
    timerArmed.value = false;
    timerLoading.value = false;
  }
};

const toggleDryerTimer = async () => {
  if (timerLoading.value || stateLoading.value) return;

  if (timerArmed.value && !timerCycleActive.value) {
    if (!servo5Adjusting.value && !servo6Adjusting.value) {
      await startDryerTimer();
    }
  } else if (timerCycleActive.value) {
    await stopDryerTimer();
  }
};

const adjustTimer = async (direction: -1 | 1) => {
  if (!timerArmed.value || timerCycleActive.value ||
      timerLoading.value || servo5Adjusting.value ||
      servo6Adjusting.value) return;

  const previousDuration = timerDuration.value;

  timerDuration.value = direction < 0
    ? (timerDuration.value <= MIN_TIMER_DURATION
        ? MAX_TIMER_DURATION
        : Math.max(MIN_TIMER_DURATION, timerDuration.value - TIMER_STEP))
    : (timerDuration.value >= MAX_TIMER_DURATION
        ? MIN_TIMER_DURATION
        : Math.min(MAX_TIMER_DURATION, timerDuration.value + TIMER_STEP));

  timerRemaining.value = timerDuration.value;
  timerMessage.value = '';
  timerError.value = '';

  try {
    await saveSettings();
  } catch (error) {
    timerDuration.value = previousDuration;
    timerRemaining.value = previousDuration;
    timerError.value = error instanceof Error
      ? `Unable to save timer setting: ${error.message}`
      : 'Unable to save timer setting.';
    return;
  }

  const servo = direction < 0 ? servo5.value : servo6.value;
  const angle = 180;

  if (direction < 0) servo5Adjusting.value = true;
  else servo6Adjusting.value = true;

  servo.loading = true;
  servo.active = true;
  servo.error = '';

  try {
    await moveAdjustmentServo(servo, angle);
  } catch (error) {
    servo.error = error instanceof Error
      ? error.message
      : `Servo ${servo.id} movement failed.`;
  } finally {
    try {
      const returnAngle = servo.id === 5 || servo.id === 6 ? 0 : 90;
      await moveServo(servo.id, returnAngle);
      servo.angle = returnAngle;
    } catch (error) {
      servo.error = error instanceof Error
        ? error.message
        : `Servo ${servo.id} return failed.`;
    }

    servo.active = false;
    servo.loading = false;

    if (direction < 0) servo5Adjusting.value = false;
    else servo6Adjusting.value = false;
  }
};

const decreaseTimer = () => adjustTimer(-1);
const increaseTimer = () => adjustTimer(1);

const adjustTemperature = async (direction: -1 | 1) => {
  if (!servo4.value.active || servo4.value.loading ||
      temperatureLoading.value || servo5Adjusting.value ||
      servo6Adjusting.value) return;

  const previousTarget = targetTemperature.value;

  targetTemperature.value = direction < 0
    ? Math.max(MIN_TARGET_TEMPERATURE, targetTemperature.value - TEMPERATURE_STEP)
    : Math.min(MAX_TARGET_TEMPERATURE, targetTemperature.value + TEMPERATURE_STEP);

  if (targetTemperature.value === previousTarget) return;

  temperatureLoading.value = true;
  temperatureMessage.value = '';

  try {
    await saveSettings();
  } catch (error) {
    targetTemperature.value = previousTarget;
    temperatureMessage.value = error instanceof Error
      ? `Unable to save temperature: ${error.message}`
      : 'Unable to save temperature.';
    temperatureLoading.value = false;
    return;
  }

  const servo = direction < 0 ? servo5.value : servo6.value;
  const angle = 180;

  if (direction < 0) servo5Adjusting.value = true;
  else servo6Adjusting.value = true;

  servo.loading = true;
  servo.active = true;
  servo.error = '';

  try {
    await moveAdjustmentServo(servo, angle);
    temperatureMessage.value =
      `Target temperature saved: ${targetTemperature.value}°C`;
  } catch (error) {
    servo.error = error instanceof Error
      ? error.message
      : `Servo ${servo.id} movement failed.`;
    temperatureMessage.value =
      'Temperature saved, but adjustment servo movement failed.';
  } finally {
    try {
      const returnAngle = servo.id === 5 || servo.id === 6 ? 0 : 90;
      await moveServo(servo.id, returnAngle);
      servo.angle = returnAngle;
    } catch (error) {
      servo.error = error instanceof Error
        ? error.message
        : `Servo ${servo.id} return failed.`;
    }

    servo.active = false;
    servo.loading = false;

    if (direction < 0) servo5Adjusting.value = false;
    else servo6Adjusting.value = false;

    temperatureLoading.value = false;
  }
};

const decreaseTemperature = () => adjustTemperature(-1);
const increaseTemperature = () => adjustTemperature(1);

const toggleServo4 = async () => {
  const servo = servo4.value;

  if (servo.loading || temperatureLoading.value ||
      stateLoading.value || servo5Adjusting.value ||
      servo6Adjusting.value) return;

  const wasActive = servo.active;
  servo.loading = true;
  servo.error = '';

  try {
    await moveServo(servo.id, 180);
    servo.angle = 180;
    await delay(1000);
    await moveServo(servo.id, servo.targetAngle);
    servo.angle = servo.targetAngle;
    await delay(1000);
    await moveServo(servo.id, 180);
    servo.angle = 180;

    if (!wasActive) {
      await postOperation('temperatureControl', 'start');
      servo.active = true;
      temperatureMessage.value = 'Temperature controller activated.';
    } else {
      temperatureMessage.value = 'Temperature settings saved successfully.';
    }
  } catch (error) {
    servo.error = error instanceof Error
      ? error.message
      : 'Servo 4 operation failed.';
    servo.active = wasActive;

    try {
      await moveServo(servo.id, 180);
      servo.angle = 180;
    } catch (returnError) {
      servo.error += returnError instanceof Error
        ? ` | Unable to return to 180 degrees: ${returnError.message}`
        : ' | Unable to return to 180 degrees.';
    }
  } finally {
    servo.loading = false;
  }
};

const refreshDashboard = async () => {
  await Promise.all([fetchSensors(), loadDashboardState()]);
};

let sensorInterval: ReturnType<typeof setInterval> | null = null;

onMounted(async () => {
  await loadDashboardState();
  await fetchSensors();
  sensorInterval = setInterval(() => void fetchSensors(), 2000);
});

onUnmounted(() => {
  if (sensorInterval !== null) {
    clearInterval(sensorInterval);
    sensorInterval = null;
  }

  clearTimerInterval();
  timerRunId++;
});
</script>

<style scoped>
* { box-sizing: border-box; }

.dashboard {
  min-height: 100vh;
  padding: 32px;
  background: #f4f7fb;
  color: #172033;
  font-family: Arial, Helvetica, sans-serif;
}

.dashboard-header, .section-heading, .dashboard-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
}

.dashboard-header { margin-bottom: 32px; }

.eyebrow {
  margin: 0 0 8px;
  color: #64748b;
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 1.5px;
}

.dashboard-header h1 {
  margin: 0;
  font-size: 30px;
  font-weight: 800;
}

.subtitle, .section-description {
  margin: 8px 0 0;
  color: #64748b;
  font-size: 14px;
}

.connection {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 15px;
  border-radius: 30px;
  background: #fee2e2;
  color: #b91c1c;
  font-size: 13px;
  font-weight: 700;
}

.connection.online {
  background: #dcfce7;
  color: #15803d;
}

.connection-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: currentColor;
}

.sensor-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 22px;
}

.sensor-card, .servo-card {
  min-width: 0;
  padding: 25px;
  border: 1px solid #e5eaf2;
  border-radius: 18px;
  background: #fff;
  box-shadow: 0 5px 20px rgba(15, 23, 42, .04);
}

.card-top {
  display: flex;
  align-items: center;
  gap: 12px;
}

.sensor-icon, .servo-icon {
  display: grid;
  width: 45px;
  height: 45px;
  place-items: center;
  border-radius: 13px;
  font-size: 23px;
}

.temperature-icon, .temperature-controller-icon {
  background: #fff0e8;
}

.humidity-icon {
  background: #e8f4ff;
}

.sensor-label {
  color: #64748b;
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 1px;
}

.sensor-card h2 {
  margin: 24px 0 5px;
  font-size: 42px;
  font-weight: 800;
}

.sensor-card h2 small {
  margin-left: 3px;
  color: #64748b;
  font-size: 20px;
}

.sensor-description {
  margin: 0 0 22px;
  color: #94a3b8;
  font-size: 13px;
}

.progress-track, .temperature-progress-track {
  height: 8px;
  overflow: hidden;
  border-radius: 20px;
  background: #edf1f6;
}

.progress-fill, .temperature-progress-fill {
  height: 100%;
  border-radius: 20px;
  transition: width .3s ease;
}

.temperature-fill { background: #f97316; }
.humidity-fill { background: #2694e8; }

.sensor-footer {
  display: flex;
  justify-content: space-between;
  margin-top: 13px;
  color: #94a3b8;
  font-size: 12px;
}

.sensor-footer strong { color: #334155; }
.sensor-footer strong.sensor-status-warning { color: #b45309; }
.sensor-footer strong.sensor-status-error { color: #b91c1c; }

.servo-section { margin-top: 35px; }
.section-heading { margin-bottom: 18px; }
.section-heading h2 { margin: 0; font-size: 23px; }

.device-status {
  padding: 7px 12px;
  border-radius: 20px;
  background: #e0f2fe;
  color: #0369a1;
  font-size: 11px;
  font-weight: 800;
}

.servo-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  align-items: stretch;
  gap: 22px;
}

.servo-card {
  display: flex;
  min-height: 430px;
  height: 100%;
  flex-direction: column;
}

.power-card {
  align-items: center;
  text-align: center;
  background: linear-gradient(145deg, #fff, #f8fafc);
}

.power-card-header {
  display: flex;
  width: 100%;
  align-items: center;
  justify-content: space-between;
  text-align: left;
}

.power-card-header h3 {
  margin: 0;
  font-size: 19px;
}

.power-status, .timer-status {
  padding: 7px 11px;
  border-radius: 20px;
  background: #fee2e2;
  color: #dc2626;
  font-size: 10px;
  font-weight: 800;
}

.power-status.power-on {
  background: #dcfce7;
  color: #15803d;
}

.power-control {
  display: grid;
  width: 112px;
  height: 112px;
  flex-shrink: 0;
  place-items: center;
  margin-top: 30px;
  border: 8px solid #fee2e2;
  border-radius: 50%;
  background: #ef4444;
  color: #fff;
  cursor: pointer;
  box-shadow: 0 10px 25px rgba(239, 68, 68, .2);
  transition: .25s ease;
}

.power-control svg {
  width: 48px;
  height: 48px;
}

.power-control:hover:not(:disabled) {
  transform: scale(1.06);
}

.power-control.power-active {
  border-color: #dcfce7;
  background: #16a34a;
}

.power-control:disabled {
  cursor: not-allowed;
  opacity: .6;
}

.power-label {
  margin: 18px 0 0;
  color: #dc2626;
  font-size: 21px;
  font-weight: 800;
}

.power-label.power-label-on { color: #15803d; }

.power-description {
  max-width: 250px;
  margin: 8px 0 0;
  color: #64748b;
  font-size: 13px;
  line-height: 1.6;
}

.movement-message {
  margin: 10px 0 0;
  color: #64748b;
  font-size: 12px;
  font-weight: 600;
}

.timer-card {
  background: linear-gradient(145deg, #fff, #f8fbff);
}

.timer-header {
  display: flex;
  min-height: 60px;
  align-items: flex-start;
  justify-content: space-between;
  gap: 10px;
}

.servo-information {
  display: flex;
  min-width: 0;
  flex: 1;
  align-items: center;
  gap: 10px;
}

.servo-information > div {
  min-width: 0;
}

.timer-icon {
  display: grid;
  width: 45px;
  height: 45px;
  flex-shrink: 0;
  place-items: center;
  border-radius: 13px;
  background: #e0eaff;
  font-size: 23px;
}

.servo-information h3 {
  margin: 0;
  font-size: 16px;
  line-height: 1.25;
}

.servo-information p {
  margin: 5px 0 0;
  color: #94a3b8;
  font-size: 11px;
  white-space: nowrap;
}

.timer-status {
  flex-shrink: 0;
  padding: 6px 8px;
  background: #e2e8f0;
  color: #475569;
  white-space: nowrap;
}

.timer-status-running {
  background: #dcfce7;
  color: #15803d;
}

.timer-display {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 105px;
  margin: 16px 0;
}

.timer-count {
  color: #1e40af;
  font-size: 52px;
  font-weight: 800;
  font-variant-numeric: tabular-nums;
  letter-spacing: 2px;
}

.timer-caption, .angle-label {
  margin-top: 5px;
  color: #64748b;
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 1px;
}

.timer-adjustment, .temperature-adjustment {
  display: grid;
  width: 100%;
  grid-template-columns: 48px minmax(0, 1fr) 48px;
  align-items: center;
  gap: 8px;
  margin: 16px 0 20px;
}

.adjust-button {
  display: grid;
  width: 48px;
  height: 48px;
  flex-shrink: 0;
  place-items: center;
  border: 0;
  border-radius: 12px;
  color: #fff;
  font-size: 30px;
  font-weight: 700;
  cursor: pointer;
  transition: .2s ease;
}

.minus-button { background: #dc2626; }
.minus-button:hover:not(:disabled) { background: #b91c1c; }
.plus-button { background: #16a34a; }
.plus-button:hover:not(:disabled) { background: #15803d; }

.adjust-button:disabled {
  opacity: .4;
  cursor: not-allowed;
}

.adjustment-label {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 5px;
  text-align: center;
}

.adjustment-label strong {
  color: #1e40af;
  font-size: 14px;
}

.adjustment-label span {
  color: #94a3b8;
  font-size: 10px;
  white-space: nowrap;
}

.timer-progress-track {
  height: 9px;
  overflow: hidden;
  border-radius: 20px;
  background: #e2e8f0;
}

.timer-progress-fill {
  height: 100%;
  border-radius: 20px;
  background: #2563eb;
  transition: width .3s ease;
}

.timer-buttons {
  display: grid;
  grid-template-columns: 1fr;
  gap: 10px;
  margin-top: auto;
  padding-top: 22px;
}

.timer-button {
  display: flex;
  width: 100%;
  min-height: 50px;
  align-items: center;
  justify-content: center;
  border: 0;
  border-radius: 11px;
  color: #fff;
  font-size: 14px;
  font-weight: 800;
  cursor: pointer;
  transition: .2s ease;
}

.start-timer-button, .start-button { background: #16a34a; }

.start-timer-button:hover:not(:disabled),
.start-button:hover:not(:disabled) {
  background: #15803d;
}

.stop-timer-button, .stop-button { background: #dc2626; }

.stop-timer-button:hover:not(:disabled),
.stop-button:hover:not(:disabled) {
  background: #b91c1c;
}

.timer-button:disabled, .servo-button:disabled {
  cursor: not-allowed;
  opacity: .45;
}

.timer-instruction, .servo-instruction {
  margin: 14px 0 0;
  color: #64748b;
  font-size: 12px;
  line-height: 1.6;
  text-align: center;
}

.timer-message {
  margin: 9px 0 0;
  color: #15803d;
  font-size: 12px;
  font-weight: 700;
  text-align: center;
}

.temperature-controller {
  background: linear-gradient(145deg, #fff, #fffaf5);
}

.temperature-display {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 105px;
  margin: 16px 0;
}

.temperature-number {
  color: #ea580c;
  font-size: 52px;
  font-weight: 800;
  font-variant-numeric: tabular-nums;
}

.current-temperature {
  display: flex;
  justify-content: space-between;
  gap: 8px;
  padding: 12px;
  border-radius: 10px;
  background: #fff7ed;
  color: #9a3412;
  font-size: 12px;
}

.current-temperature strong { font-size: 14px; }

.temperature-progress-track {
  margin-bottom: 20px;
  background: #ffedd5;
}

.temperature-progress-fill { background: #f97316; }

.temperature-adjustment .adjustment-label strong {
  color: #ea580c;
}

.servo-button {
  display: block;
  width: 100%;
  margin-top: auto;
  padding: 15px;
  border: 0;
  border-radius: 12px;
  color: #fff;
  font-size: 14px;
  font-weight: 800;
  cursor: pointer;
  transition: .2s;
}

.save-temperature-button {
  background: #16a34a !important;
  color: #fff;
}

.save-temperature-button:hover:not(:disabled) {
  background: #15803d !important;
}

.error-message {
  margin: 12px 0 0;
  color: #dc2626;
  font-size: 13px;
  text-align: center;
}

.dashboard-footer {
  margin-top: 30px;
  padding: 18px 20px;
  border: 1px solid #e5eaf2;
  border-radius: 14px;
  background: #fff;
}

.dashboard-footer div {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.updated-label {
  color: #94a3b8;
  font-size: 11px;
}

.dashboard-footer strong {
  color: #475569;
  font-size: 13px;
}

.refresh-button {
  padding: 10px 16px;
  border: 0;
  border-radius: 9px;
  background: #2563eb;
  color: #fff;
  font-weight: 700;
  cursor: pointer;
}

.refresh-button:disabled {
  opacity: .6;
  cursor: not-allowed;
}

@media (max-width: 1100px) {
  .servo-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 700px) {
  .dashboard { padding: 18px; }

  .dashboard-header {
    align-items: flex-start;
    flex-direction: column;
  }

  .sensor-grid, .servo-grid {
    grid-template-columns: minmax(0, 1fr);
  }

  .section-heading {
    align-items: flex-start;
    flex-direction: column;
    gap: 12px;
  }

  .servo-card { min-height: auto; }

  .dashboard-footer {
    align-items: flex-start;
    flex-direction: column;
  }

  .refresh-button { width: 100%; }
}
</style>
