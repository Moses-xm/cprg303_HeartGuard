// src/services/storageService.js
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Data Storage Service
 * Manages all local data storage and retrieval
 */

const STORAGE_KEYS = {
  HEART_RATE_HISTORY: '@HeartGuard:heartRateHistory',
  HEALTH_RECORDS: '@HeartGuard:healthRecords',
  THRESHOLDS: '@HeartGuard:thresholds',
  USER_SETTINGS: '@HeartGuard:userSettings',
};

class StorageService {
  /**
   * Save heart rate record
   */
  async saveHeartRateRecord(heartRate) {
    try {
      const record = {
        value: heartRate,
        timestamp: Date.now(),
        date: new Date().toISOString(),
      };

      const history = await this.getHeartRateHistory();
      history.push(record);

      // Keep only last 30 days of data
      const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
      const filtered = history.filter(r => r.timestamp > thirtyDaysAgo);

      await AsyncStorage.setItem(
        STORAGE_KEYS.HEART_RATE_HISTORY,
        JSON.stringify(filtered),
      );

      return true;
    } catch (error) {
      console.error('Failed to save heart rate record:', error);
      return false;
    }
  }

  /**
   * Get heart rate history
   */
  async getHeartRateHistory() {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.HEART_RATE_HISTORY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Failed to get heart rate history:', error);
      return [];
    }
  }

  /**
   * Save complete health record (including multiple metrics)
   */
  async saveHealthRecord(record) {
    try {
      const fullRecord = {
        ...record,
        timestamp: Date.now(),
        date: new Date().toISOString(),
      };

      const history = await this.getHealthRecords();
      history.push(fullRecord);

      // Keep only last 30 days of data
      const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
      const filtered = history.filter(r => r.timestamp > thirtyDaysAgo);

      await AsyncStorage.setItem(
        STORAGE_KEYS.HEALTH_RECORDS,
        JSON.stringify(filtered),
      );

      return true;
    } catch (error) {
      console.error('Failed to save health record:', error);
      return false;
    }
  }

  /**
   * Get complete health records
   */
  async getHealthRecords() {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.HEALTH_RECORDS);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Failed to get health records:', error);
      return [];
    }
  }

  /**
   * Get data for specified number of days
   */
  async getRecentData(days = 7) {
    try {
      const history = await this.getHeartRateHistory();
      const startDate = Date.now() - days * 24 * 60 * 60 * 1000;
      return history.filter(r => r.timestamp > startDate);
    } catch (error) {
      console.error('Failed to get recent data:', error);
      return [];
    }
  }

  /**
   * Get today's data only
   */
  async getTodayData() {
    try {
      const history = await this.getHeartRateHistory();
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const startOfDay = today.getTime();

      return history.filter(r => r.timestamp >= startOfDay);
    } catch (error) {
      console.error("Failed to get today's data:", error);
      return [];
    }
  }

  /**
   * Get data within specified date range
   */
  async getDataInRange(startDate, endDate) {
    try {
      const history = await this.getHeartRateHistory();
      return history.filter(
        r => r.timestamp >= startDate && r.timestamp <= endDate,
      );
    } catch (error) {
      console.error('Failed to get data in range:', error);
      return [];
    }
  }

  /**
   * Save threshold settings
   */
  async saveThresholds(thresholds) {
    try {
      await AsyncStorage.setItem(
        STORAGE_KEYS.THRESHOLDS,
        JSON.stringify(thresholds),
      );
      return true;
    } catch (error) {
      console.error('Failed to save thresholds:', error);
      return false;
    }
  }

  /**
   * Get threshold settings
   */
  async getThresholds() {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.THRESHOLDS);
      return data
        ? JSON.parse(data)
        : { min: 60, max: 100, minBloodOxygen: 95 };
    } catch (error) {
      console.error('Failed to get thresholds:', error);
      return { min: 60, max: 100, minBloodOxygen: 95 };
    }
  }

  /**
   * Save user settings
   */
  async saveUserSettings(settings) {
    try {
      await AsyncStorage.setItem(
        STORAGE_KEYS.USER_SETTINGS,
        JSON.stringify(settings),
      );
      return true;
    } catch (error) {
      console.error('Failed to save user settings:', error);
      return false;
    }
  }

  /**
   * Get user settings
   */
  async getUserSettings() {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.USER_SETTINGS);
      return data
        ? JSON.parse(data)
        : {
            notifications: true,
            autoSave: true,
            theme: 'light',
          };
    } catch (error) {
      console.error('Failed to get user settings:', error);
      return {
        notifications: true,
        autoSave: true,
        theme: 'light',
      };
    }
  }

  /**
   * Clear all data
   */
  async clearAllData() {
    try {
      await AsyncStorage.multiRemove([
        STORAGE_KEYS.HEART_RATE_HISTORY,
        STORAGE_KEYS.HEALTH_RECORDS,
      ]);
      return true;
    } catch (error) {
      console.error('Failed to clear data:', error);
      return false;
    }
  }

  /**
   * Get statistics
   */
  async getStatistics(days = 7) {
    try {
      const data = await this.getRecentData(days);

      if (data.length === 0) {
        return {
          average: 0,
          max: 0,
          min: 0,
          count: 0,
          trend: 'stable',
        };
      }

      const values = data.map(r => r.value);
      const sum = values.reduce((acc, val) => acc + val, 0);
      const average = Math.round(sum / values.length);
      const max = Math.max(...values);
      const min = Math.min(...values);

      // Calculate trend
      const mid = Math.floor(values.length / 2);
      const firstHalf = values.slice(0, mid);
      const secondHalf = values.slice(mid);

      const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
      const secondAvg =
        secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;

      let trend = 'stable';
      if (secondAvg > firstAvg + 5) trend = 'rising';
      if (secondAvg < firstAvg - 5) trend = 'falling';

      return {
        average,
        max,
        min,
        count: data.length,
        trend,
        firstAvg: Math.round(firstAvg),
        secondAvg: Math.round(secondAvg),
      };
    } catch (error) {
      console.error('Failed to get statistics:', error);
      return {
        average: 0,
        max: 0,
        min: 0,
        count: 0,
        trend: 'stable',
      };
    }
  }

  /**
   * Group data by day
   */
  async getDataGroupedByDay(days = 7) {
    try {
      const data = await this.getRecentData(days);
      const grouped = {};

      data.forEach(record => {
        const date = new Date(record.timestamp);
        const dateKey = `${date.getFullYear()}-${
          date.getMonth() + 1
        }-${date.getDate()}`;

        if (!grouped[dateKey]) {
          grouped[dateKey] = [];
        }
        grouped[dateKey].push(record.value);
      });

      // Calculate daily average
      const result = Object.keys(grouped).map(dateKey => {
        const values = grouped[dateKey];
        const average = Math.round(
          values.reduce((a, b) => a + b, 0) / values.length,
        );
        return {
          date: dateKey,
          average,
          count: values.length,
          max: Math.max(...values),
          min: Math.min(...values),
        };
      });

      // Sort by date
      result.sort((a, b) => new Date(a.date) - new Date(b.date));

      return result;
    } catch (error) {
      console.error('Failed to group data by day:', error);
      return [];
    }
  }

  /**
   * Export data as JSON format
   */
  async exportDataAsJSON() {
    try {
      const heartRate = await this.getHeartRateHistory();
      const healthRecords = await this.getHealthRecords();
      const thresholds = await this.getThresholds();
      const settings = await this.getUserSettings();

      return JSON.stringify(
        {
          exportDate: new Date().toISOString(),
          heartRateHistory: heartRate,
          healthRecords: healthRecords,
          thresholds: thresholds,
          settings: settings,
        },
        null,
        2,
      );
    } catch (error) {
      console.error('Failed to export JSON:', error);
      return null;
    }
  }

  /**
   * Get storage space usage information
   */
  async getStorageInfo() {
    try {
      const heartRate = await this.getHeartRateHistory();
      const healthRecords = await this.getHealthRecords();

      return {
        heartRateCount: heartRate.length,
        healthRecordCount: healthRecords.length,
        estimatedSize:
          this.calculateSize(heartRate) + this.calculateSize(healthRecords),
      };
    } catch (error) {
      console.error('Failed to get storage info:', error);
      return {
        heartRateCount: 0,
        healthRecordCount: 0,
        estimatedSize: 0,
      };
    }
  }

  /**
   * Calculate data size (bytes)
   */
  calculateSize(data) {
    return new Blob([JSON.stringify(data)]).size;
  }
}

// Export singleton instance
export default new StorageService();
