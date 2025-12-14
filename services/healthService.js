// src/services/healthService.js
/**
 * Health Data Service
 * Responsible for acquiring and processing health-related data
 * In production, this should integrate with real health data APIs like Google Fit
 */

class HealthService {
  constructor() {
    this.isInitialized = false;
    this.thresholds = {
      minHeartRate: 60,
      maxHeartRate: 100,
      minBloodOxygen: 95,
    };
    // Store daily data that resets at midnight
    this.dailyData = {
      steps: 0,
      calories: 0,
      lastUpdateDate: new Date().toDateString(),
    };
    this.initializeDailyData();
  }

  /**
   * Initialize or reset daily data at midnight
   */
  initializeDailyData() {
    const today = new Date().toDateString();

    // Reset if it's a new day
    if (this.dailyData.lastUpdateDate !== today) {
      this.dailyData = {
        steps: 0,
        calories: 0,
        lastUpdateDate: today,
      };
    }
  }

  /**
   * Initialize health service
   * In production, this would initialize Google Fit or other health APIs
   */
  async initialize() {
    try {
      // Production initialization code example:
      // await GoogleFit.authorize();
      this.isInitialized = true;
      return true;
    } catch (error) {
      console.error('Health service initialization failed:', error);
      return false;
    }
  }

  /**
   * Get current heart rate
   * In production, this should fetch from health sensors or APIs
   */
  async getCurrentHeartRate() {
    // Simulate realistic heart rate data (60-100 BPM normal range, occasional anomalies)
    const baseRate = 70;
    const variation = Math.random() * 20 - 10; // -10 to +10
    const randomSpike = Math.random() < 0.1 ? (Math.random() - 0.5) * 40 : 0; // 10% chance of anomaly

    const heartRate = Math.round(baseRate + variation + randomSpike);

    // Ensure within reasonable range
    return Math.max(45, Math.min(180, heartRate));
  }

  /**
   * Get blood oxygen saturation
   */
  async getBloodOxygen() {
    // Normal blood oxygen: 95-100%
    const base = 97;
    const variation = Math.random() * 3 - 1; // -1 to +2
    return Math.round(base + variation);
  }

  /**
   * Get today's step count
   */
  async getSteps() {
    // Check if we need to reset for a new day
    this.initializeDailyData();

    // Simulate gradual step increase throughout the day
    // Steps increase by 10-30 with each check (every 3 seconds in the app)
    const increment = Math.floor(Math.random() * 21) + 10; // 10-30 steps
    this.dailyData.steps += increment;

    // Cap at reasonable maximum (30,000 steps per day)
    this.dailyData.steps = Math.min(this.dailyData.steps, 30000);

    return this.dailyData.steps;
  }

  /**
   * Get calories burned
   */
  async getCalories() {
    // Check if we need to reset for a new day
    this.initializeDailyData();

    // Calculate calories based on steps
    // Approximately 0.04-0.05 calories per step
    const caloriesPerStep = 0.045;
    this.dailyData.calories = Math.round(
      this.dailyData.steps * caloriesPerStep,
    );

    return this.dailyData.calories;
  }

  /**
   * Get distance walked (in kilometers)
   */
  async getDistance() {
    // Check if we need to reset for a new day
    this.initializeDailyData();

    // Calculate distance based on steps
    // Average stride length: 0.762 meters (2.5 feet)
    // Distance (km) = steps × 0.762 / 1000
    const metersPerStep = 0.762;
    const distanceInKm = (this.dailyData.steps * metersPerStep) / 1000;

    return parseFloat(distanceInKm.toFixed(2)); // Return with 2 decimal places
  }

  /**
   * Get respiratory rate
   */
  async getRespiratoryRate() {
    // Normal respiratory rate: 12-20 breaths/minute
    const base = 16;
    const variation = Math.random() * 4 - 2;
    return Math.round(base + variation);
  }

  /**
   * Check if heart rate is within normal range
   */
  checkHeartRateThreshold(heartRate, userAge = 30) {
    const { minHeartRate, maxHeartRate } = this.thresholds;

    if (heartRate < minHeartRate) {
      return {
        status: 'low',
        message: `Heart rate is low (${heartRate} BPM)\nRest and monitor carefully`,
        severity: 'warning',
      };
    }

    if (heartRate > maxHeartRate) {
      // Calculate maximum heart rate based on age
      const maxAllowed = 220 - userAge;

      if (heartRate > maxAllowed * 0.85) {
        return {
          status: 'high',
          message: `Heart rate is too high (${heartRate} BPM)\nStop activity and rest immediately`,
          severity: 'danger',
        };
      }

      return {
        status: 'high',
        message: `Heart rate is elevated (${heartRate} BPM)\nReduce activity intensity`,
        severity: 'warning',
      };
    }

    return {
      status: 'normal',
      message: 'Heart rate is normal',
      severity: 'normal',
    };
  }

  /**
   * Check blood oxygen level
   */
  checkBloodOxygen(bloodOxygen) {
    const { minBloodOxygen } = this.thresholds;

    if (bloodOxygen < minBloodOxygen) {
      if (bloodOxygen < 90) {
        return {
          status: 'critical',
          message: `Blood oxygen level is critical (${bloodOxygen}%)\nSeek immediate medical attention`,
          severity: 'danger',
        };
      }
      return {
        status: 'low',
        message: `Blood oxygen level is low (${bloodOxygen}%)\nTry deep breathing or outdoor activity`,
        severity: 'warning',
      };
    }

    return {
      status: 'normal',
      message: 'Blood oxygen level is normal',
      severity: 'normal',
    };
  }

  /**
   * Update threshold settings
   */
  updateThresholds(newThresholds) {
    this.thresholds = { ...this.thresholds, ...newThresholds };
  }

  /**
   * Get current thresholds
   */
  getThresholds() {
    return this.thresholds;
  }

  /**
   * Calculate target heart rate zone (for exercise)
   */
  getTargetHeartRateZone(age, intensity = 'moderate') {
    const maxHeartRate = 220 - age;

    const zones = {
      light: { min: maxHeartRate * 0.5, max: maxHeartRate * 0.6 },
      moderate: { min: maxHeartRate * 0.6, max: maxHeartRate * 0.7 },
      vigorous: { min: maxHeartRate * 0.7, max: maxHeartRate * 0.85 },
    };

    const zone = zones[intensity] || zones.moderate;

    return {
      min: Math.round(zone.min),
      max: Math.round(zone.max),
      maxHeartRate: Math.round(maxHeartRate),
    };
  }

  /**
   * Get health recommendations
   */
  getHealthRecommendation(heartRate, bloodOxygen, steps) {
    const recommendations = [];

    // Recommendations based on heart rate
    if (heartRate < 60) {
      recommendations.push(
        'Consider increasing physical activity to improve cardiovascular fitness',
      );
    } else if (heartRate > 100) {
      recommendations.push('Make sure to rest and avoid overexertion');
    } else {
      recommendations.push(
        'Heart rate is normal. Maintain good lifestyle habits',
      );
    }

    // Recommendations based on blood oxygen
    if (bloodOxygen < 95) {
      recommendations.push(
        'Increase outdoor activities and maintain good ventilation indoors',
      );
    }

    // Recommendations based on step count
    if (steps < 5000) {
      recommendations.push(
        'Daily steps are low. Try to increase activity level',
      );
    } else if (steps > 10000) {
      recommendations.push(
        'Excellent activity level. Remember to rest appropriately',
      );
    }

    return recommendations;
  }

  /**
   * Reset daily counters (useful for testing or manual reset)
   */
  resetDailyCounters() {
    this.dailyData = {
      steps: 0,
      calories: 0,
      lastUpdateDate: new Date().toDateString(),
    };
  }

  /**
   * Get current daily totals
   */
  getDailyTotals() {
    this.initializeDailyData();
    return {
      steps: this.dailyData.steps,
      calories: this.dailyData.calories,
    };
  }

  /**
   * Simulate real-time heart rate changes (for testing)
   */
  simulateRealtimeHeartRate(baseRate = 70, activity = 'resting') {
    const activityMultipliers = {
      resting: { base: 1, variation: 5 },
      walking: { base: 1.3, variation: 10 },
      running: { base: 1.8, variation: 15 },
      exercising: { base: 2, variation: 20 },
    };

    const multiplier =
      activityMultipliers[activity] || activityMultipliers.resting;
    const rate = baseRate * multiplier.base;
    const variation = (Math.random() - 0.5) * multiplier.variation;

    return Math.round(rate + variation);
  }
}

// Export singleton instance
export default new HealthService();
