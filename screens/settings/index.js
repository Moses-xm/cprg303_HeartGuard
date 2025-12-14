// src/screens/SettingsScreen.js
import React, { useState } from 'react';
import { StyleSheet, Alert, ScrollView } from 'react-native';
import {
  List,
  Switch,
  Button,
  Dialog,
  Portal,
  TextInput,
  Divider,
} from 'react-native-paper';
import RNFS from 'react-native-fs';
import storageService from '../../services/storageService';

export default function SettingsScreen() {
  const [notifications, setNotifications] = useState(true);
  const [autoSave, setAutoSave] = useState(true);
  const [thresholdDialogVisible, setThresholdDialogVisible] = useState(false);
  const [minHeartRate, setMinHeartRate] = useState('60');
  const [maxHeartRate, setMaxHeartRate] = useState('100');

  const exportData = async () => {
    try {
      const data = await storageService.getHeartRateHistory();

      if (data.length === 0) {
        Alert.alert('Notice', 'No data available to export');
        return;
      }

      const csv = convertToCSV(data);
      const timestamp = new Date().getTime();
      const filename = `heart_guard_export_${timestamp}.csv`;
      const path = `${RNFS.DocumentDirectoryPath}/${filename}`;

      await RNFS.writeFile(path, csv, 'utf8');

      Alert.alert(
        'Export Successful',
        `Data saved to:\n${path}\n\nTotal records: ${data.length}`,
        [{ text: 'OK', style: 'default' }],
      );
    } catch (error) {
      Alert.alert('Export Failed', error.message);
    }
  };

  const convertToCSV = data => {
    const header = 'Date,Time,Heart Rate (BPM)\n';
    const rows = data
      .map(r => {
        const date = new Date(r.timestamp);
        const dateStr = date.toLocaleDateString('en-US');
        const timeStr = date.toLocaleTimeString('en-US');
        return `${dateStr},${timeStr},${r.value}`;
      })
      .join('\n');
    return header + rows;
  };

  const clearAllData = () => {
    Alert.alert(
      'Confirm Clear',
      'This will delete all historical data. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          style: 'destructive',
          onPress: async () => {
            try {
              await storageService.clearAllData();
              Alert.alert('Success', 'All data has been cleared');
            } catch (error) {
              Alert.alert('Failed', 'Error clearing data');
            }
          },
        },
      ],
    );
  };

  const saveThresholds = () => {
    const min = parseInt(minHeartRate);
    const max = parseInt(maxHeartRate);

    if (isNaN(min) || isNaN(max)) {
      Alert.alert('Error', 'Please enter valid numbers');
      return;
    }

    if (min >= max) {
      Alert.alert('Error', 'Minimum heart rate must be less than maximum');
      return;
    }

    if (min < 40 || max > 200) {
      Alert.alert('Error', 'Please enter reasonable heart rate range (40-200)');
      return;
    }

    storageService.saveThresholds({ min, max });
    setThresholdDialogVisible(false);
    Alert.alert('Success', 'Threshold settings saved');
  };

  return (
    <ScrollView style={styles.container}>
      {/* Notification settings */}
      <List.Section>
        <List.Subheader>Notification Settings</List.Subheader>
        <List.Item
          title="Abnormal Heart Rate Alert"
          description="Send notification when heart rate exceeds set range"
          left={props => <List.Icon {...props} icon="bell-ring" />}
          right={() => (
            <Switch value={notifications} onValueChange={setNotifications} />
          )}
        />
        <Divider />
        <List.Item
          title="Auto-save Data"
          description="Automatically save historical records during monitoring"
          left={props => <List.Icon {...props} icon="content-save-auto" />}
          right={() => <Switch value={autoSave} onValueChange={setAutoSave} />}
        />
      </List.Section>

      <Divider />

      {/* Threshold settings */}
      <List.Section>
        <List.Subheader>Threshold Settings</List.Subheader>
        <List.Item
          title="Heart Rate Warning Threshold"
          description={`Min: ${minHeartRate} BPM | Max: ${maxHeartRate} BPM`}
          left={props => <List.Icon {...props} icon="heart-cog" />}
          onPress={() => setThresholdDialogVisible(true)}
          right={props => <List.Icon {...props} icon="chevron-right" />}
        />
      </List.Section>

      <Divider />

      {/* Data management */}
      <List.Section>
        <List.Subheader>Data Management</List.Subheader>
        <List.Item
          title="Export Data"
          description="Export as CSV format for viewing on computer"
          left={props => <List.Icon {...props} icon="download" />}
          onPress={exportData}
          right={props => <List.Icon {...props} icon="chevron-right" />}
        />
        <Divider />
        <List.Item
          title="Clear All Data"
          description="Delete all historical records"
          left={props => <List.Icon {...props} icon="delete" color="#e74c3c" />}
          onPress={clearAllData}
          right={props => <List.Icon {...props} icon="chevron-right" />}
          titleStyle={{ color: '#e74c3c' }}
        />
      </List.Section>

      <Divider />

      {/* About */}
      <List.Section>
        <List.Subheader>About</List.Subheader>
        <List.Item
          title="Heart Guard"
          description="Version 1.0.0"
          left={props => <List.Icon {...props} icon="information" />}
        />
        <List.Item
          title="Privacy Policy"
          description="Learn how we protect your data"
          left={props => <List.Icon {...props} icon="shield-account" />}
          right={props => <List.Icon {...props} icon="chevron-right" />}
        />
        <List.Item
          title="Help & Feedback"
          description="Get help or provide feedback"
          left={props => <List.Icon {...props} icon="help-circle" />}
          right={props => <List.Icon {...props} icon="chevron-right" />}
        />
      </List.Section>

      {/* Threshold settings dialog */}
      <Portal>
        <Dialog
          visible={thresholdDialogVisible}
          onDismiss={() => setThresholdDialogVisible(false)}
        >
          <Dialog.Title>Set Heart Rate Threshold</Dialog.Title>
          <Dialog.Content>
            <TextInput
              label="Minimum Heart Rate (BPM)"
              value={minHeartRate}
              onChangeText={setMinHeartRate}
              keyboardType="numeric"
              mode="outlined"
              style={styles.input}
            />
            <TextInput
              label="Maximum Heart Rate (BPM)"
              value={maxHeartRate}
              onChangeText={setMaxHeartRate}
              keyboardType="numeric"
              mode="outlined"
              style={styles.input}
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setThresholdDialogVisible(false)}>
              Cancel
            </Button>
            <Button onPress={saveThresholds}>Save</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  input: {
    marginBottom: 10,
  },
});