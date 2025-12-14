// src/screens/HomeScreen.js
import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, ScrollView } from 'react-native';
import { Card, Button, Portal, Dialog } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import healthService from '../../services/healthService';
import storageService from '../../services/storageService';

export default function HomeScreen() {
  const [heartRate, setHeartRate] = useState(0);
  const [bloodOxygen, setBloodOxygen] = useState(0);
  const [steps, setSteps] = useState(0);
  const [calories, setCalories] = useState(0);
  const [distance, setDistance] = useState(0);
  const [monitoring, setMonitoring] = useState(false);
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');

  const pulseAnim = useRef(new Animated.Value(1)).current;
  const intervalRef = useRef(null);

  useEffect(() => {
    // Heart beat animation
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.2,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
      ]),
    );

    if (monitoring) {
      pulse.start();
    } else {
      pulse.stop();
      pulseAnim.setValue(1);
    }

    return () => pulse.stop();
  }, [monitoring, pulseAnim]);

  useEffect(() => {
    if (monitoring) {
      startMonitoring();
    } else {
      stopMonitoring();
    }

    return () => stopMonitoring();
  }, [monitoring]);

  const startMonitoring = async () => {
    // Get data immediately
    await updateHealthData();

    // Update data every 3 seconds
    intervalRef.current = setInterval(async () => {
      await updateHealthData();
    }, 3000);
  };

  const stopMonitoring = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  const updateHealthData = async () => {
    try {
      // Get health data
      const hr = await healthService.getCurrentHeartRate();
      const bo = await healthService.getBloodOxygen();
      const st = await healthService.getSteps();
      const cal = await healthService.getCalories();
      const dist = await healthService.getDistance();

      setHeartRate(hr);
      setBloodOxygen(bo);
      setSteps(st);
      setCalories(cal);
      setDistance(dist);

      // Check heart rate threshold
      const check = healthService.checkHeartRateThreshold(hr);
      if (check.status !== 'normal') {
        showAlert(check.message);
      }

      // Save heart rate data
      await storageService.saveHeartRateRecord(hr);

      // Save other health data
      await storageService.saveHealthRecord({
        heartRate: hr,
        bloodOxygen: bo,
        steps: st,
        calories: cal,
        distance: dist,
      });
    } catch (error) {
      console.error('Failed to update health data:', error);
    }
  };

  const showAlert = message => {
    setAlertMessage(message);
    setAlertVisible(true);
  };

  const getHeartRateColor = () => {
    if (heartRate === 0) return '#95a5a6';
    if (heartRate < 60) return '#3498db';
    if (heartRate > 100) return '#e74c3c';
    return '#2ecc71';
  };

  const getHeartRateStatus = () => {
    if (heartRate === 0) return 'Waiting';
    if (heartRate < 60) return 'Low';
    if (heartRate > 100) return 'High';
    return 'Normal';
  };

  return (
    <ScrollView style={styles.container}>
      {/* Main heart rate card */}
      <Card style={styles.mainCard} elevation={4}>
        <Card.Content>
          <View style={styles.mainMetricContainer}>
            <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
              <Icon name="heart-pulse" size={60} color={getHeartRateColor()} />
            </Animated.View>
            <Text style={[styles.mainValue, { color: getHeartRateColor() }]}>
              {heartRate}
            </Text>
            <Text style={styles.mainUnit}>BPM</Text>
            <View style={styles.statusBadge}>
              <Text style={[styles.statusText, { color: getHeartRateColor() }]}>
                {getHeartRateStatus()}
              </Text>
            </View>
          </View>
        </Card.Content>
      </Card>

      {/* Other health metrics */}
      <View style={styles.metricsGrid}>
        <Card style={styles.metricCard} elevation={2}>
          <Card.Content style={styles.metricContent}>
            <Icon name="water" size={36} color="#3498db" />
            <Text style={styles.metricValue}>{bloodOxygen}%</Text>
            <Text style={styles.metricLabel}>Blood Oxygen</Text>
            <Text style={styles.metricStatus}>
              {bloodOxygen >= 95 ? 'Normal' : 'Low'}
            </Text>
          </Card.Content>
        </Card>

        <Card style={styles.metricCard} elevation={2}>
          <Card.Content style={styles.metricContent}>
            <Icon name="walk" size={36} color="#2ecc71" />
            <Text style={styles.metricValue}>{steps}</Text>
            <Text style={styles.metricLabel}>Steps Today</Text>
            <Text style={styles.metricStatus}>Goal: 10,000</Text>
          </Card.Content>
        </Card>
      </View>

      <View style={styles.metricsGrid}>
        <Card style={styles.metricCard} elevation={2}>
          <Card.Content style={styles.metricContent}>
            <Icon name="fire" size={36} color="#e67e22" />
            <Text style={styles.metricValue}>{calories}</Text>
            <Text style={styles.metricLabel}>Calories</Text>
            <Text style={styles.metricStatus}>kcal</Text>
          </Card.Content>
        </Card>

        <Card style={styles.metricCard} elevation={2}>
          <Card.Content style={styles.metricContent}>
            <Icon name="map-marker-distance" size={36} color="#16a085" />
            <Text style={styles.metricValue}>{distance}</Text>
            <Text style={styles.metricLabel}>Distance</Text>
            <Text style={styles.metricStatus}>km</Text>
          </Card.Content>
        </Card>
      </View>

      {/* Control card */}
      <Card style={styles.controlCard} elevation={3}>
        <Card.Content>
          <View style={styles.controlContent}>
            <View style={styles.statusSection}>
              <Icon
                name={monitoring ? 'heart-pulse' : 'heart-off'}
                size={40}
                color={monitoring ? '#e74c3c' : '#95a5a6'}
              />
              <View style={styles.statusTextContainer}>
                <Text style={styles.statusTitle}>
                  {monitoring ? 'Monitoring Active' : 'Monitoring Stopped'}
                </Text>
                <Text style={styles.statusSubtitle}>
                  {monitoring
                    ? 'Real-time data collection'
                    : 'Tap button to start'}
                </Text>
              </View>
            </View>

            <Button
              mode={monitoring ? 'outlined' : 'contained'}
              onPress={() => setMonitoring(!monitoring)}
              style={styles.controlButton}
              icon={monitoring ? 'stop' : 'play'}
              contentStyle={styles.buttonContent}
            >
              {monitoring ? 'Stop' : 'Start'}
            </Button>
          </View>
        </Card.Content>
      </Card>

      {/* Warning dialog */}
      <Portal>
        <Dialog visible={alertVisible} onDismiss={() => setAlertVisible(false)}>
          <Dialog.Icon icon="alert" color="#e74c3c" />
          <Dialog.Title>Health Warning</Dialog.Title>
          <Dialog.Content>
            <Text>{alertMessage}</Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setAlertVisible(false)}>Got it</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  mainCard: {
    margin: 16,
    borderRadius: 16,
    backgroundColor: '#fff',
  },
  mainMetricContainer: {
    alignItems: 'center',
    paddingVertical: 30,
  },
  mainValue: {
    fontSize: 80,
    fontWeight: 'bold',
    marginTop: 10,
  },
  mainUnit: {
    fontSize: 20,
    color: '#7f8c8d',
    marginTop: 5,
  },
  statusBadge: {
    marginTop: 15,
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#ecf0f1',
  },
  statusText: {
    fontSize: 16,
    fontWeight: '600',
  },
  metricsGrid: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  metricCard: {
    flex: 1,
    marginHorizontal: 4,
    borderRadius: 12,
  },
  metricContent: {
    alignItems: 'center',
    paddingVertical: 15,
  },
  metricValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginTop: 8,
  },
  metricLabel: {
    fontSize: 13,
    color: '#7f8c8d',
    marginTop: 4,
  },
  metricStatus: {
    fontSize: 11,
    color: '#95a5a6',
    marginTop: 2,
  },
  controlCard: {
    margin: 16,
    marginTop: 8,
    borderRadius: 12,
    backgroundColor: '#fff',
  },
  controlContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statusSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  statusTextContainer: {
    marginLeft: 12,
    flex: 1,
  },
  statusTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
  },
  statusSubtitle: {
    fontSize: 12,
    color: '#7f8c8d',
    marginTop: 2,
  },
  controlButton: {
    marginLeft: 12,
  },
  buttonContainer: {
    paddingHorizontal: 16,
    marginVertical: 10,
  },
  button: {
    borderRadius: 12,
  },
  buttonContent: {
    paddingVertical: 8,
  },
  tipCard: {
    margin: 16,
    backgroundColor: '#e8f4f8',
  },
});
