<template>
  <div class="iot-controller">
    <!-- IoT Header -->
    <div class="iot-header">
      <div class="header-info">
        <p class="header-subtitle">eLilySense Drying System Monitor</p>
      </div>
      <div class="connection-status" :class="isConnected ? 'online' : 'offline'">
        <span class="status-dot"></span>
        {{ isConnected ? 'Connected' : 'Disconnected' }}
      </div>
    </div>

    <!-- IoT Navigation Tabs -->
    <div class="iot-tabs">
      <button 
        v-for="tab in tabs" 
        :key="tab.id" 
        @click="activeTab = tab.id"
        class="iot-tab"
        :class="{ active: activeTab === tab.id }"
      >
        <component :is="tab.icon" />
        {{ tab.label }}
      </button>
    </div>

    <!-- Dashboard Tab -->
    <div v-if="activeTab === 'dashboard'" class="tab-content">
      <!-- Sensor Cards -->
      <div class="sensor-grid">
        <div class="sensor-card temperature">
          <div class="sensor-icon">
            <TempIcon />
          </div>
          <div class="sensor-data">
            <span class="sensor-label">Temperature</span>
            <span class="sensor-value">{{ sensorData.temperature }}°C</span>
            <span class="sensor-target">Target: {{ settings.targetTemp }}°C</span>
          </div>
          <div class="sensor-indicator" :class="getTempStatus()"></div>
        </div>

        <div class="sensor-card humidity">
          <div class="sensor-icon">
            <HumidityIcon />
          </div>
          <div class="sensor-data">
            <span class="sensor-label">Humidity</span>
            <span class="sensor-value">{{ sensorData.humidity }}%</span>
            <span class="sensor-target">Target: {{ settings.targetHumidity }}%</span>
          </div>
          <div class="sensor-indicator" :class="getHumidityStatus()"></div>
        </div>
      </div>

      <!-- Drying Progress -->
      <div class="progress-card">
        <div class="progress-header">
          <div class="progress-icon">
            <ProgressIcon />
          </div>
          <div class="progress-info">
            <span class="progress-label">Drying Progress</span>
            <span class="progress-time" v-if="dryingState.isRunning">
              Elapsed: {{ formatTime(dryingState.elapsed) }}
            </span>
          </div>
          <span class="progress-percent">{{ dryingState.progress }}%</span>
        </div>
        <div class="progress-bar-container">
          <div class="progress-bar" :style="{ width: dryingState.progress + '%' }"></div>
        </div>
        <div class="progress-footer">
          <span class="batch-info">Batch #{{ currentBatch }}</span>
          <span class="status-badge" :class="dryingState.status">
            {{ formatStatus(dryingState.status) }}
          </span>
        </div>
      </div>

      <!-- Control Buttons -->
      <div class="control-actions">
        <button 
          @click="startDrying" 
          :disabled="dryingState.isRunning" 
          class="action-btn start"
        >
          <PlayIcon /> Start
        </button>
        <button 
          @click="pauseDrying" 
          :disabled="!dryingState.isRunning || dryingState.status === 'paused'" 
          class="action-btn pause"
        >
          <PauseIcon /> Pause
        </button>
        <button 
          @click="stopDrying" 
          :disabled="dryingState.status === 'idle'" 
          class="action-btn stop"
        >
          <StopIcon /> Stop
        </button>
      </div>

      <!-- Recent Activity -->
      <div class="activity-card">
        <h3>Recent Activity</h3>
        <div class="activity-list">
          <div v-for="(log, index) in activityLogs.slice(0, 5)" :key="index" class="activity-item">
            <span class="activity-icon" :class="log.type">
              <component :is="getLogIcon(log.type)" />
            </span>
            <div class="activity-info">
              <span class="activity-title">{{ log.title }}</span>
              <span class="activity-time">{{ log.time }}</span>
            </div>
          </div>
          <p v-if="activityLogs.length === 0" class="no-activity">No recent activity</p>
        </div>
      </div>
    </div>

    <!-- Control Panel Tab -->
    <div v-if="activeTab === 'control'" class="tab-content">
      <!-- Operation Mode -->
      <div class="control-card">
        <h3>Operation Mode</h3>
        <div class="mode-selector">
          <button 
            @click="setMode('manual')" 
            class="mode-btn" 
            :class="{ active: settings.mode === 'manual' }"
          >
            <ManualIcon /> Manual
          </button>
          <button 
            @click="setMode('auto')" 
            class="mode-btn" 
            :class="{ active: settings.mode === 'auto' }"
          >
            <AutoIcon /> Automatic
          </button>
        </div>
        <p class="mode-description">
          {{ settings.mode === 'auto' 
            ? 'System automatically adjusts devices based on target settings.' 
            : 'Manual control over all connected devices.' }}
        </p>
      </div>

      <!-- Device Controls -->
      <div class="control-card" :class="{ disabled: settings.mode === 'auto' }">
        <h3>Device Controls</h3>
        <div class="device-list">
          <div class="device-item">
            <div class="device-info">
              <span class="device-icon heater"><HeaterIcon /></span>
              <div>
                <span class="device-name">Heater</span>
                <span class="device-status">{{ devices.heater ? 'Running' : 'Off' }}</span>
              </div>
            </div>
            <label class="toggle-switch">
              <input 
                type="checkbox" 
                v-model="devices.heater" 
                @change="toggleDevice('heater')"
                :disabled="settings.mode === 'auto'"
              />
              <span class="toggle-slider"></span>
            </label>
          </div>

          <div class="device-item">
            <div class="device-info">
              <span class="device-icon fan"><FanIcon /></span>
              <div>
                <span class="device-name">Exhaust Fan</span>
                <span class="device-status">{{ devices.fan ? 'Running' : 'Off' }}</span>
              </div>
            </div>
            <label class="toggle-switch">
              <input 
                type="checkbox" 
                v-model="devices.fan" 
                @change="toggleDevice('fan')"
                :disabled="settings.mode === 'auto'"
              />
              <span class="toggle-slider"></span>
            </label>
          </div>

          <div class="device-item">
            <div class="device-info">
              <span class="device-icon dehumidifier"><DehumidifierIcon /></span>
              <div>
                <span class="device-name">Dehumidifier</span>
                <span class="device-status">{{ devices.dehumidifier ? 'Running' : 'Off' }}</span>
              </div>
            </div>
            <label class="toggle-switch">
              <input 
                type="checkbox" 
                v-model="devices.dehumidifier" 
                @change="toggleDevice('dehumidifier')"
                :disabled="settings.mode === 'auto'"
              />
              <span class="toggle-slider"></span>
            </label>
          </div>
        </div>
      </div>

      <!-- Target Settings -->
      <div class="control-card">
        <h3>Target Settings</h3>
        <div class="setting-item">
          <div class="setting-header">
            <span class="setting-label">Target Temperature</span>
            <span class="setting-value">{{ settings.targetTemp }}°C</span>
          </div>
          <input 
            type="range" 
            v-model="settings.targetTemp" 
            min="20" 
            max="60" 
            class="range-slider temp"
          />
          <div class="range-labels">
            <span>20°C</span>
            <span>60°C</span>
          </div>
        </div>

        <div class="setting-item">
          <div class="setting-header">
            <span class="setting-label">Target Humidity</span>
            <span class="setting-value">{{ settings.targetHumidity }}%</span>
          </div>
          <input 
            type="range" 
            v-model="settings.targetHumidity" 
            min="10" 
            max="90" 
            class="range-slider humidity"
          />
          <div class="range-labels">
            <span>10%</span>
            <span>90%</span>
          </div>
        </div>

        <div class="setting-item">
          <div class="setting-header">
            <span class="setting-label">Drying Duration</span>
            <span class="setting-value">{{ settings.duration }} mins</span>
          </div>
          <input 
            type="range" 
            v-model="settings.duration" 
            min="30" 
            max="480" 
            step="30"
            class="range-slider duration"
          />
          <div class="range-labels">
            <span>30 min</span>
            <span>8 hrs</span>
          </div>
        </div>

        <button @click="saveSettings" class="save-btn">
          <SaveIcon /> Save Settings
        </button>
      </div>
    </div>

    <!-- Detection Tab -->
    <div v-if="activeTab === 'detection'" class="tab-content">
      <!-- Live Feed -->
      <div class="detection-card camera-feed">
        <div class="camera-container">
          <div class="live-badge">
            <span class="live-dot"></span>
            LIVE
          </div>
          <div class="scanning-line"></div>
          
          <!-- Mold Detection Box -->
          <div v-if="detection.moldDetected" class="mold-box">
            <span class="mold-label">MOLD {{ detection.confidence }}%</span>
          </div>

          <div class="camera-placeholder">
            <CameraIcon />
            <span>AI Vision Active</span>
          </div>
        </div>

        <button @click="simulateMoldDetection" class="simulate-btn">
          <BugIcon /> Simulate Detection
        </button>
      </div>

      <!-- Detection Stats -->
      <div class="stats-grid">
        <div class="stat-card">
          <span class="stat-label">Batch Health</span>
          <span class="stat-value" :class="detection.health.toLowerCase()">
            {{ detection.health }}
          </span>
        </div>
        <div class="stat-card">
          <span class="stat-label">Detections</span>
          <span class="stat-value">{{ detection.count }}</span>
        </div>
      </div>

      <!-- Detection History -->
      <div class="detection-card">
        <h3>Detection History</h3>
        <div class="detection-list">
          <div 
            v-for="(item, index) in detection.history" 
            :key="index" 
            class="detection-item"
            :class="item.type"
          >
            <span class="detection-icon">
              <component :is="item.type === 'alert' ? AlertIcon : CheckIcon" />
            </span>
            <div class="detection-info">
              <span class="detection-title">{{ item.title }}</span>
              <span class="detection-time">{{ item.time }}</span>
            </div>
            <span class="detection-badge" :class="item.type">{{ item.type }}</span>
          </div>
          <p v-if="detection.history.length === 0" class="no-data">No detections recorded</p>
        </div>
      </div>

      <!-- Alert Modal -->
      <div v-if="showAlert" class="alert-modal">
        <div class="alert-content">
          <AlertIcon class="alert-icon" />
          <h2>MOLD ALERT!</h2>
          <p>Hazardous mold growth detected in the current chamber.</p>
          <p class="alert-action"><strong>Immediate intervention required.</strong></p>
          <button @click="acknowledgeAlert" class="acknowledge-btn">
            ACKNOWLEDGE
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, reactive, onMounted, onUnmounted } from 'vue'

// Icons
const DashboardIcon = { template: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="9"/><rect x="14" y="3" width="7" height="5"/><rect x="14" y="12" width="7" height="9"/><rect x="3" y="16" width="7" height="5"/></svg>` }
const ControlIcon = { template: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>` }
const DetectionIcon = { template: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>` }
const TempIcon = { template: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 14.76V3.5a2.5 2.5 0 0 0-5 0v11.26a4.5 4.5 0 1 0 5 0z"/></svg>` }
const HumidityIcon = { template: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/></svg>` }
const ProgressIcon = { template: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/></svg>` }
const PlayIcon = { template: `<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>` }
const PauseIcon = { template: `<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>` }
const StopIcon = { template: `<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><rect x="4" y="4" width="16" height="16" rx="2"/></svg>` }
const HeaterIcon = { template: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>` }
const FanIcon = { template: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 12c-2-2.67-6-2.67-6-8 4.67 0 6 2 6 4m0 4c2.67-2 2.67-6 8-6 0 4.67-2 6-4 6m-4 0c2 2.67 6 2.67 6 8-4.67 0-6-2-6-4m0-4c-2.67 2-2.67 6-8 6 0-4.67 2-6 4-6"/><circle cx="12" cy="12" r="2"/></svg>` }
const DehumidifierIcon = { template: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/><line x1="8" y1="12" x2="16" y2="12"/></svg>` }
const ManualIcon = { template: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 11V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v0"/><path d="M14 10V4a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v2"/><path d="M10 10.5V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v8"/><path d="M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15"/></svg>` }
const AutoIcon = { template: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2v4"/><path d="m16.2 7.8 2.9-2.9"/><path d="M18 12h4"/><path d="m16.2 16.2 2.9 2.9"/><path d="M12 18v4"/><path d="m4.9 19.1 2.9-2.9"/><path d="M2 12h4"/><path d="m4.9 4.9 2.9 2.9"/></svg>` }
const SaveIcon = { template: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>` }
const CameraIcon = { template: `<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>` }
const BugIcon = { template: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="8" y="6" width="8" height="14" rx="4"/><path d="M19 8l-2 2"/><path d="M5 8l2 2"/><path d="M19 16l-2-2"/><path d="M5 16l2-2"/><path d="M9 2h6"/><path d="M12 2v4"/></svg>` }
const AlertIcon = { template: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>` }
const CheckIcon = { template: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>` }
const InfoIcon = { template: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>` }

export default {
  name: 'IoTController',
  components: {
    DashboardIcon, ControlIcon, DetectionIcon, TempIcon, HumidityIcon, ProgressIcon,
    PlayIcon, PauseIcon, StopIcon, HeaterIcon, FanIcon, DehumidifierIcon,
    ManualIcon, AutoIcon, SaveIcon, CameraIcon, BugIcon, AlertIcon, CheckIcon, InfoIcon
  },
  setup() {
    const activeTab = ref('dashboard')
    const isConnected = ref(true)
    const currentBatch = ref(1)
    const showAlert = ref(false)
    let dryingInterval = null

    const tabs = [
      { id: 'dashboard', label: 'Dashboard', icon: DashboardIcon },
      { id: 'control', label: 'Control', icon: ControlIcon },
      { id: 'detection', label: 'Detection', icon: DetectionIcon }
    ]

    const sensorData = reactive({
      temperature: 28.5,
      humidity: 52
    })

    const dryingState = reactive({
      isRunning: false,
      status: 'idle', // idle, running, paused, completed
      progress: 0,
      elapsed: 0,
      startTime: null
    })

    const settings = reactive({
      mode: 'manual',
      targetTemp: 35,
      targetHumidity: 40,
      duration: 120
    })

    const devices = reactive({
      heater: false,
      fan: false,
      dehumidifier: false
    })

    const detection = reactive({
      moldDetected: false,
      confidence: 0,
      health: 'EXCELLENT',
      count: 0,
      history: []
    })

    const activityLogs = ref([])

    // Sensor simulation
    const simulateSensorData = () => {
      if (dryingState.isRunning) {
        // Gradually approach target values
        const tempDiff = settings.targetTemp - sensorData.temperature
        const humDiff = settings.targetHumidity - sensorData.humidity
        sensorData.temperature = Math.round((sensorData.temperature + tempDiff * 0.05) * 10) / 10
        sensorData.humidity = Math.round(sensorData.humidity + humDiff * 0.03)
      } else {
        // Small random fluctuations when idle
        sensorData.temperature = Math.round((sensorData.temperature + (Math.random() - 0.5) * 0.5) * 10) / 10
        sensorData.humidity = Math.round(sensorData.humidity + (Math.random() - 0.5) * 2)
      }
      sensorData.temperature = Math.max(20, Math.min(60, sensorData.temperature))
      sensorData.humidity = Math.max(10, Math.min(90, sensorData.humidity))
    }

    const getTempStatus = () => {
      const diff = Math.abs(sensorData.temperature - settings.targetTemp)
      if (diff <= 2) return 'optimal'
      if (diff <= 5) return 'warning'
      return 'critical'
    }

    const getHumidityStatus = () => {
      const diff = Math.abs(sensorData.humidity - settings.targetHumidity)
      if (diff <= 5) return 'optimal'
      if (diff <= 10) return 'warning'
      return 'critical'
    }

    const formatTime = (seconds) => {
      const hrs = Math.floor(seconds / 3600)
      const mins = Math.floor((seconds % 3600) / 60)
      const secs = seconds % 60
      if (hrs > 0) return `${hrs}h ${mins}m`
      return `${mins}m ${secs}s`
    }

    const formatStatus = (status) => {
      return status.charAt(0).toUpperCase() + status.slice(1)
    }

    const addLog = (type, title) => {
      activityLogs.value.unshift({
        type,
        title,
        time: new Date().toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit' })
      })
    }

    const startDrying = () => {
      if (dryingState.isRunning) return
      dryingState.isRunning = true
      dryingState.status = 'running'
      dryingState.startTime = Date.now() - (dryingState.elapsed * 1000)
      addLog('info', 'Drying process started')
      
      // Auto-enable devices in auto mode
      if (settings.mode === 'auto') {
        devices.heater = true
        devices.fan = true
      }
    }

    const pauseDrying = () => {
      dryingState.isRunning = false
      dryingState.status = 'paused'
      addLog('warning', 'Drying process paused')
    }

    const stopDrying = () => {
      dryingState.isRunning = false
      dryingState.status = 'idle'
      dryingState.progress = 0
      dryingState.elapsed = 0
      dryingState.startTime = null
      addLog('info', 'Drying process stopped')
      devices.heater = false
      devices.fan = false
    }

    const updateProgress = () => {
      if (!dryingState.isRunning) return
      
      dryingState.elapsed = Math.floor((Date.now() - dryingState.startTime) / 1000)
      const totalSeconds = settings.duration * 60
      dryingState.progress = Math.min(Math.floor((dryingState.elapsed / totalSeconds) * 100), 100)

      if (dryingState.progress >= 100) {
        dryingState.isRunning = false
        dryingState.status = 'completed'
        currentBatch.value++
        addLog('success', 'Batch completed successfully')
        devices.heater = false
        devices.fan = false
      }
    }

    const setMode = (mode) => {
      settings.mode = mode
      addLog('info', `Switched to ${mode} mode`)
    }

    const toggleDevice = (device) => {
      addLog('info', `${device.charAt(0).toUpperCase() + device.slice(1)} ${devices[device] ? 'enabled' : 'disabled'}`)
    }

    const saveSettings = () => {
      localStorage.setItem('iotSettings', JSON.stringify(settings))
      addLog('success', 'Settings saved')
    }

    const simulateMoldDetection = () => {
      detection.moldDetected = true
      detection.confidence = 98
      detection.health = 'CRITICAL'
      detection.count++
      showAlert.value = true
      detection.history.unshift({
        type: 'alert',
        title: 'Mold detected in chamber',
        time: new Date().toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit' })
      })
      addLog('alert', 'Mold detected!')
    }

    const acknowledgeAlert = () => {
      showAlert.value = false
      detection.moldDetected = false
      detection.confidence = 0
      detection.health = 'MONITORING'
    }

    const getLogIcon = (type) => {
      switch (type) {
        case 'alert': return AlertIcon
        case 'success': return CheckIcon
        case 'warning': return AlertIcon
        default: return InfoIcon
      }
    }

    let sensorInterval = null
    let progressInterval = null

    onMounted(() => {
      // Load saved settings
      const saved = localStorage.getItem('iotSettings')
      if (saved) {
        const parsed = JSON.parse(saved)
        Object.assign(settings, parsed)
      }

      // Start simulation intervals
      sensorInterval = setInterval(simulateSensorData, 2000)
      progressInterval = setInterval(updateProgress, 1000)

      // Initial log
      addLog('info', 'IoT Controller initialized')
    })

    onUnmounted(() => {
      clearInterval(sensorInterval)
      clearInterval(progressInterval)
      clearInterval(dryingInterval)
    })

    return {
      activeTab, tabs, isConnected, currentBatch, showAlert,
      sensorData, dryingState, settings, devices, detection, activityLogs,
      getTempStatus, getHumidityStatus, formatTime, formatStatus,
      startDrying, pauseDrying, stopDrying, setMode, toggleDevice, saveSettings,
      simulateMoldDetection, acknowledgeAlert, getLogIcon
    }
  }
}
</script>

<style scoped>
.iot-controller {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

/* Header */
.iot-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-subtitle { color: #64748b; }

.connection-status {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border-radius: 999px;
  font-size: 0.85rem;
  font-weight: 500;
}

.connection-status.online {
  background: #dcfce7;
  color: #166534;
}

.connection-status.offline {
  background: #fee2e2;
  color: #991b1b;
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: currentColor;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

/* Tabs */
.iot-tabs {
  display: flex;
  gap: 0.5rem;
  background: white;
  padding: 0.5rem;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
}

.iot-tab {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  border: none;
  background: transparent;
  border-radius: 8px;
  font-weight: 500;
  color: #64748b;
  cursor: pointer;
  transition: all 0.2s;
}

.iot-tab:hover { background: #f1f5f9; }

.iot-tab.active {
  background: #2d5a27;
  color: white;
}

.tab-content {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

/* Sensor Cards */
.sensor-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.sensor-card {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  display: flex;
  align-items: center;
  gap: 1rem;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
  position: relative;
  overflow: hidden;
}

.sensor-icon {
  width: 50px;
  height: 50px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.sensor-card.temperature .sensor-icon { background: #fee2e2; color: #dc2626; }
.sensor-card.humidity .sensor-icon { background: #dbeafe; color: #2563eb; }

.sensor-data {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.sensor-label { font-size: 0.85rem; color: #64748b; }
.sensor-value { font-size: 1.75rem; font-weight: 700; color: #1e293b; }
.sensor-target { font-size: 0.75rem; color: #94a3b8; }

.sensor-indicator {
  position: absolute;
  top: 0;
  right: 0;
  width: 8px;
  height: 100%;
}

.sensor-indicator.optimal { background: #22c55e; }
.sensor-indicator.warning { background: #f59e0b; }
.sensor-indicator.critical { background: #ef4444; }

/* Progress Card */
.progress-card {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
}

.progress-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1rem;
}

.progress-icon {
  width: 50px;
  height: 50px;
  background: #dcfce7;
  color: #16a34a;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.progress-info {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.progress-label { font-weight: 600; color: #1e293b; }
.progress-time { font-size: 0.85rem; color: #64748b; }

.progress-percent {
  font-size: 2.5rem;
  font-weight: 700;
  color: #2d5a27;
}

.progress-bar-container {
  height: 12px;
  background: #e2e8f0;
  border-radius: 6px;
  overflow: hidden;
  margin-bottom: 1rem;
}

.progress-bar {
  height: 100%;
  background: linear-gradient(90deg, #2d5a27, #4ade80);
  border-radius: 6px;
  transition: width 0.3s;
}

.progress-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.batch-info { font-size: 0.85rem; color: #64748b; }

.status-badge {
  padding: 0.25rem 0.75rem;
  border-radius: 999px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
}

.status-badge.idle { background: #f1f5f9; color: #64748b; }
.status-badge.running { background: #dcfce7; color: #166534; }
.status-badge.paused { background: #fef3c7; color: #92400e; }
.status-badge.completed { background: #dbeafe; color: #1d4ed8; }

/* Control Actions */
.control-actions {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
}

.action-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 1rem;
  border: none;
  border-radius: 10px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.action-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.action-btn.start { background: #dcfce7; color: #166534; }
.action-btn.start:hover:not(:disabled) { background: #bbf7d0; }
.action-btn.pause { background: #fef3c7; color: #92400e; }
.action-btn.pause:hover:not(:disabled) { background: #fde68a; }
.action-btn.stop { background: #fee2e2; color: #991b1b; }
.action-btn.stop:hover:not(:disabled) { background: #fecaca; }

/* Activity Card */
.activity-card {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
}

.activity-card h3 {
  margin: 0 0 1rem 0;
  font-size: 1rem;
  color: #1e293b;
}

.activity-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.activity-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem;
  background: #f8fafc;
  border-radius: 8px;
}

.activity-icon {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.activity-icon.info { background: #dbeafe; color: #2563eb; }
.activity-icon.success { background: #dcfce7; color: #16a34a; }
.activity-icon.warning { background: #fef3c7; color: #f59e0b; }
.activity-icon.alert { background: #fee2e2; color: #dc2626; }

.activity-info { flex: 1; }
.activity-title { font-size: 0.9rem; color: #374151; display: block; }
.activity-time { font-size: 0.75rem; color: #94a3b8; }

.no-activity { color: #94a3b8; text-align: center; padding: 1rem; }

/* Control Panel */
.control-card {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
}

.control-card.disabled {
  opacity: 0.6;
  pointer-events: none;
}

.control-card h3 {
  margin: 0 0 1rem 0;
  font-size: 1rem;
  color: #1e293b;
}

.mode-selector {
  display: flex;
  gap: 0.5rem;
  background: #f1f5f9;
  padding: 0.25rem;
  border-radius: 10px;
  margin-bottom: 0.75rem;
}

.mode-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.75rem;
  border: none;
  background: transparent;
  border-radius: 8px;
  font-weight: 500;
  color: #64748b;
  cursor: pointer;
  transition: all 0.2s;
}

.mode-btn.active {
  background: white;
  color: #2d5a27;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.mode-description {
  font-size: 0.85rem;
  color: #64748b;
  margin: 0;
}

.device-list {
  display: flex;
  flex-direction: column;
}

.device-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 0;
  border-bottom: 1px solid #f1f5f9;
}

.device-item:last-child { border-bottom: none; }

.device-info {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.device-icon {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.device-icon.heater { background: #fef3c7; color: #f59e0b; }
.device-icon.fan { background: #dbeafe; color: #3b82f6; }
.device-icon.dehumidifier { background: #ede9fe; color: #8b5cf6; }

.device-name { font-weight: 500; color: #1e293b; display: block; }
.device-status { font-size: 0.8rem; color: #64748b; }

/* Toggle Switch */
.toggle-switch {
  position: relative;
  width: 50px;
  height: 28px;
}

.toggle-switch input {
  opacity: 0;
  width: 0;
  height: 0;
}

.toggle-slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: #cbd5e1;
  transition: 0.3s;
  border-radius: 28px;
}

.toggle-slider:before {
  position: absolute;
  content: "";
  height: 22px;
  width: 22px;
  left: 3px;
  bottom: 3px;
  background-color: white;
  transition: 0.3s;
  border-radius: 50%;
}

.toggle-switch input:checked + .toggle-slider {
  background-color: #2d5a27;
}

.toggle-switch input:checked + .toggle-slider:before {
  transform: translateX(22px);
}

/* Settings */
.setting-item {
  margin-bottom: 1.5rem;
}

.setting-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 0.5rem;
}

.setting-label { color: #374151; font-size: 0.9rem; }
.setting-value { font-weight: 600; color: #2d5a27; }

.range-slider {
  width: 100%;
  height: 8px;
  border-radius: 4px;
  appearance: none;
  outline: none;
  margin: 0.5rem 0;
}

.range-slider::-webkit-slider-thumb {
  appearance: none;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: #2d5a27;
  cursor: pointer;
  border: 3px solid white;
  box-shadow: 0 2px 4px rgba(0,0,0,0.2);
}

.range-slider.temp { background: linear-gradient(90deg, #3b82f6, #ef4444); }
.range-slider.humidity { background: linear-gradient(90deg, #fef3c7, #3b82f6); }
.range-slider.duration { background: linear-gradient(90deg, #e2e8f0, #2d5a27); }

.range-labels {
  display: flex;
  justify-content: space-between;
  font-size: 0.75rem;
  color: #94a3b8;
}

.save-btn {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.875rem;
  background: #2d5a27;
  color: white;
  border: none;
  border-radius: 10px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;
}

.save-btn:hover { background: #1e3d1a; }

/* Detection Tab */
.detection-card {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
}

.detection-card h3 {
  margin: 0 0 1rem 0;
  font-size: 1rem;
  color: #1e293b;
}

.camera-container {
  position: relative;
  height: 220px;
  background: #111;
  border-radius: 12px;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 1rem;
}

.live-badge {
  position: absolute;
  top: 12px;
  left: 12px;
  display: flex;
  align-items: center;
  gap: 6px;
  background: rgba(220, 38, 38, 0.9);
  color: white;
  padding: 4px 10px;
  border-radius: 4px;
  font-size: 10px;
  font-weight: 700;
  z-index: 10;
}

.live-dot {
  width: 6px;
  height: 6px;
  background: white;
  border-radius: 50%;
  animation: blink 1s infinite;
}

@keyframes blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.3; }
}

.scanning-line {
  position: absolute;
  width: 100%;
  height: 2px;
  background: #4ade80;
  box-shadow: 0 0 15px #4ade80;
  animation: scan 3s linear infinite;
}

@keyframes scan {
  0% { top: 0; }
  100% { top: 100%; }
}

.mold-box {
  position: absolute;
  width: 100px;
  height: 100px;
  border: 3px solid #ef4444;
  box-shadow: 0 0 20px rgba(239, 68, 68, 0.5);
  animation: pulse-box 1s infinite;
}

@keyframes pulse-box {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; }
}

.mold-label {
  position: absolute;
  top: -22px;
  left: -3px;
  background: #ef4444;
  color: white;
  font-size: 10px;
  padding: 2px 6px;
  font-weight: 600;
}

.camera-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  color: #555;
}

.camera-placeholder span {
  font-size: 11px;
  margin-top: 8px;
  letter-spacing: 1px;
}

.simulate-btn {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.875rem;
  background: #fef3c7;
  color: #92400e;
  border: none;
  border-radius: 10px;
  font-weight: 600;
  cursor: pointer;
}

.simulate-btn:hover { background: #fde68a; }

.stats-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.stat-card {
  background: white;
  border-radius: 12px;
  padding: 1.25rem;
  text-align: center;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
}

.stat-label {
  display: block;
  font-size: 0.85rem;
  color: #64748b;
  margin-bottom: 0.5rem;
}

.stat-value {
  font-size: 1.5rem;
  font-weight: 700;
  color: #1e293b;
}

.stat-value.excellent { color: #16a34a; }
.stat-value.monitoring { color: #3b82f6; }
.stat-value.critical { color: #dc2626; }

.detection-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.detection-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem;
  background: #f8fafc;
  border-radius: 8px;
}

.detection-item.alert { background: #fef2f2; }

.detection-icon {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.detection-item.alert .detection-icon { background: #fee2e2; color: #dc2626; }
.detection-item.clear .detection-icon { background: #dcfce7; color: #16a34a; }

.detection-info { flex: 1; }
.detection-title { font-size: 0.9rem; color: #374151; display: block; }
.detection-time { font-size: 0.75rem; color: #94a3b8; }

.detection-badge {
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.7rem;
  font-weight: 600;
  text-transform: uppercase;
}

.detection-badge.alert { background: #fee2e2; color: #dc2626; }
.detection-badge.clear { background: #dcfce7; color: #16a34a; }

.no-data { color: #94a3b8; text-align: center; padding: 1rem; }

/* Alert Modal */
.alert-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.85);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 3000;
  padding: 1rem;
}

.alert-content {
  background: white;
  padding: 2rem;
  border-radius: 20px;
  text-align: center;
  max-width: 360px;
  border-top: 8px solid #dc2626;
}

.alert-content .alert-icon {
  width: 70px;
  height: 70px;
  color: #dc2626;
}

.alert-content h2 {
  color: #dc2626;
  margin: 1rem 0;
}

.alert-content p {
  color: #64748b;
  line-height: 1.6;
  margin-bottom: 0.5rem;
}

.alert-action {
  color: #1e293b !important;
}

.acknowledge-btn {
  width: 100%;
  padding: 1rem;
  background: #dc2626;
  color: white;
  border: none;
  border-radius: 10px;
  font-weight: 700;
  cursor: pointer;
  margin-top: 1rem;
}

.acknowledge-btn:hover { background: #b91c1c; }

@media (max-width: 768px) {
  .sensor-grid { grid-template-columns: 1fr; }
  .control-actions { grid-template-columns: 1fr; }
  .stats-grid { grid-template-columns: 1fr; }
}
</style>
