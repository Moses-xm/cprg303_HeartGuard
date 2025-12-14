// src/screens/HistoryScreen.js
import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, Dimensions } from 'react-native';
import {
  Card,
  SegmentedButtons,
  DataTable,
  ActivityIndicator,
} from 'react-native-paper';
import { LineChart } from 'react-native-chart-kit';
import storageService from '../../services/storageService';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const screenWidth = Dimensions.get('window').width;

export default function HistoryScreen() {
  const [period, setPeriod] = useState('today');
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    average: 0,
    max: 0,
    min: 0,
    trend: 'stable',
  });

  useEffect(() => {
    loadData();
  }, [period]);

  const loadData = async () => {
    setLoading(true);
    try {
      let records;
      if (period === 'today') {
        records = await storageService.getTodayData();
      } else {
        const days = parseInt(period);
        records = await storageService.getRecentData(days);
      }
      setData(records);
      calculateStats(records);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = records => {
    if (records.length === 0) {
      setStats({ average: 0, max: 0, min: 0, trend: 'stable' });
      return;
    }

    const values = records.map(r => r.value);
    const sum = values.reduce((acc, val) => acc + val, 0);
    const average = Math.round(sum / values.length);
    const max = Math.max(...values);
    const min = Math.min(...values);

    // Calculate trend (compare first half and second half averages)
    const mid = Math.floor(values.length / 2);
    const firstHalf = values.slice(0, mid);
    const secondHalf = values.slice(mid);

    const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;

    let trend = 'stable';
    if (secondAvg > firstAvg + 5) trend = 'rising';
    if (secondAvg < firstAvg - 5) trend = 'falling';

    setStats({ average, max, min, trend });
  };

  const prepareChartData = () => {
    if (data.length === 0) {
      return {
        labels: ['No Data'],
        datasets: [{ data: [0] }],
      };
    }

    // For "Today" view, show hourly data with time labels
    if (period === 'today') {
      const hourlyData = {};

      data.forEach(record => {
        const date = new Date(record.timestamp);
        const hour = date.getHours();
        const timeKey = `${hour}:00`;

        if (!hourlyData[timeKey]) {
          hourlyData[timeKey] = [];
        }
        hourlyData[timeKey].push(record.value);
      });

      const labels = [];
      const values = [];

      // Sort by hour
      Object.keys(hourlyData)
        .sort((a, b) => parseInt(a) - parseInt(b))
        .forEach(timeKey => {
          const hourValues = hourlyData[timeKey];
          const avg = Math.round(
            hourValues.reduce((a, b) => a + b, 0) / hourValues.length,
          );
          labels.push(timeKey);
          values.push(avg);
        });

      return {
        labels:
          labels.length > 12 ? labels.filter((_, i) => i % 2 === 0) : labels,
        datasets: [
          {
            data:
              values.length > 12
                ? values.filter((_, i) => i % 2 === 0)
                : values,
            color: (opacity = 1) => `rgba(231, 76, 60, ${opacity})`,
            strokeWidth: 3,
          },
        ],
      };
    }

    // For other periods, group by date and calculate daily average
    const groupedByDay = {};
    data.forEach(record => {
      const date = new Date(record.timestamp);
      const dateKey = `${date.getMonth() + 1}/${date.getDate()}`;

      if (!groupedByDay[dateKey]) {
        groupedByDay[dateKey] = [];
      }
      groupedByDay[dateKey].push(record.value);
    });

    // Calculate daily average
    const labels = [];
    const values = [];
    Object.keys(groupedByDay).forEach(dateKey => {
      const dayValues = groupedByDay[dateKey];
      const avg = Math.round(
        dayValues.reduce((a, b) => a + b, 0) / dayValues.length,
      );
      labels.push(dateKey);
      values.push(avg);
    });

    // Only show recent points
    const maxPoints = 10;
    const displayLabels = labels.slice(-maxPoints);
    const displayValues = values.slice(-maxPoints);

    return {
      labels: displayLabels,
      datasets: [
        {
          data: displayValues,
          color: (opacity = 1) => `rgba(231, 76, 60, ${opacity})`,
          strokeWidth: 3,
        },
      ],
    };
  };

  const getTrendIcon = () => {
    switch (stats.trend) {
      case 'rising':
        return 'trending-up';
      case 'falling':
        return 'trending-down';
      default:
        return 'trending-neutral';
    }
  };

  const getTrendColor = () => {
    switch (stats.trend) {
      case 'rising':
        return '#e74c3c';
      case 'falling':
        return '#3498db';
      default:
        return '#95a5a6';
    }
  };

  const getTrendText = () => {
    switch (stats.trend) {
      case 'rising':
        return 'Rising Trend';
      case 'falling':
        return 'Falling Trend';
      default:
        return 'Stable';
    }
  };

  const chartConfig = {
    backgroundColor: '#ffffff',
    backgroundGradientFrom: '#ffffff',
    backgroundGradientTo: '#ffffff',
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(231, 76, 60, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(44, 62, 80, ${opacity})`,
    style: {
      borderRadius: 16,
    },
    propsForDots: {
      r: '5',
      strokeWidth: '2',
      stroke: '#e74c3c',
    },
    propsForBackgroundLines: {
      strokeDasharray: '',
      stroke: '#e0e0e0',
    },
  };

  return (
    <ScrollView style={styles.container}>
      {/* Time period selection */}
      <Card style={styles.card}>
        <Card.Content>
          <SegmentedButtons
            value={period}
            onValueChange={setPeriod}
            buttons={[
              { value: 'today', label: 'Today' },
              { value: '7', label: '7 Days' },
              { value: '14', label: '14 Days' },
              { value: '30', label: '30 Days' },
            ]}
          />
        </Card.Content>
      </Card>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#e74c3c" />
          <Text style={styles.loadingText}>Loading data...</Text>
        </View>
      ) : (
        <>
          {/* Statistics overview */}
          <Card style={styles.card}>
            <Card.Title title="Statistics Overview" />
            <Card.Content>
              <View style={styles.statsGrid}>
                <View style={styles.statItem}>
                  <Icon name="chart-line" size={30} color="#3498db" />
                  <Text style={styles.statValue}>{stats.average}</Text>
                  <Text style={styles.statLabel}>Average HR</Text>
                </View>
                <View style={styles.statItem}>
                  <Icon name="arrow-up-bold" size={30} color="#e74c3c" />
                  <Text style={styles.statValue}>{stats.max}</Text>
                  <Text style={styles.statLabel}>Max HR</Text>
                </View>
                <View style={styles.statItem}>
                  <Icon name="arrow-down-bold" size={30} color="#2ecc71" />
                  <Text style={styles.statValue}>{stats.min}</Text>
                  <Text style={styles.statLabel}>Min HR</Text>
                </View>
              </View>

              <View
                style={[
                  styles.trendBadge,
                  { backgroundColor: getTrendColor() + '20' },
                ]}
              >
                <Icon name={getTrendIcon()} size={20} color={getTrendColor()} />
                <Text style={[styles.trendText, { color: getTrendColor() }]}>
                  {getTrendText()}
                </Text>
              </View>
            </Card.Content>
          </Card>

          {/* Heart rate trend chart */}
          <Card style={styles.card}>
            <Card.Title
              title="Heart Rate Trend"
              subtitle={period === 'today' ? 'Hourly Average' : 'Daily Average'}
            />
            <Card.Content>
              {data.length > 0 ? (
                <LineChart
                  data={prepareChartData()}
                  width={screenWidth - 60}
                  height={240}
                  chartConfig={chartConfig}
                  bezier
                  style={styles.chart}
                  withInnerLines={true}
                  withOuterLines={true}
                  withVerticalLines={false}
                  withHorizontalLines={true}
                  fromZero={false}
                  segments={4}
                />
              ) : (
                <View style={styles.noDataContainer}>
                  <Icon name="chart-line-variant" size={60} color="#bdc3c7" />
                  <Text style={styles.noDataText}>No Data Available</Text>
                  <Text style={styles.noDataSubtext}>
                    Start monitoring to view trends
                  </Text>
                </View>
              )}
            </Card.Content>
          </Card>

          {/* Recent records table */}
          <Card style={styles.card}>
            <Card.Title
              title="Recent Records"
              subtitle={
                period === 'today' ? "Today's entries" : 'Last 10 entries'
              }
            />
            <Card.Content>
              <DataTable>
                <DataTable.Header>
                  <DataTable.Title>Date & Time</DataTable.Title>
                  <DataTable.Title numeric>Heart Rate</DataTable.Title>
                  <DataTable.Title numeric>Status</DataTable.Title>
                </DataTable.Header>

                {data
                  .slice(period === 'today' ? -20 : -10)
                  .reverse()
                  .map((record, index) => {
                    const date = new Date(record.timestamp);
                    const dateStr =
                      period === 'today'
                        ? `${date.getHours()}:${String(
                            date.getMinutes(),
                          ).padStart(2, '0')}`
                        : `${
                            date.getMonth() + 1
                          }/${date.getDate()} ${date.getHours()}:${String(
                            date.getMinutes(),
                          ).padStart(2, '0')}`;
                    const status =
                      record.value < 60
                        ? 'Low'
                        : record.value > 100
                        ? 'High'
                        : 'Normal';
                    const statusColor =
                      record.value < 60
                        ? '#3498db'
                        : record.value > 100
                        ? '#e74c3c'
                        : '#2ecc71';

                    return (
                      <DataTable.Row key={index}>
                        <DataTable.Cell>{dateStr}</DataTable.Cell>
                        <DataTable.Cell numeric>{record.value}</DataTable.Cell>
                        <DataTable.Cell numeric>
                          <Text
                            style={{ color: statusColor, fontWeight: '600' }}
                          >
                            {status}
                          </Text>
                        </DataTable.Cell>
                      </DataTable.Row>
                    );
                  })}
              </DataTable>

              {data.length === 0 && (
                <View style={styles.emptyTable}>
                  <Text style={styles.emptyText}>No records available</Text>
                </View>
              )}
            </Card.Content>
          </Card>

          {/* Health recommendations */}
          {stats.average > 0 && (
            <Card style={styles.card}>
              <Card.Title title="Health Recommendations" />
              <Card.Content>
                {stats.average < 60 && (
                  <Text style={styles.suggestionText}>
                    • Your average heart rate is low. Consider increasing
                    physical activity{'\n'}• If you feel dizzy or fatigued,
                    consult a doctor
                  </Text>
                )}
                {stats.average >= 60 && stats.average <= 100 && (
                  <Text style={styles.suggestionText}>
                    • Your heart rate is in the normal range. Keep it up!{'\n'}•
                    Maintain regular sleep schedule and moderate exercise
                  </Text>
                )}
                {stats.average > 100 && (
                  <Text style={styles.suggestionText}>
                    • Your average heart rate is high. Make sure to rest{'\n'}•
                    Avoid overexertion and seek medical advice if needed
                  </Text>
                )}
              </Card.Content>
            </Card>
          )}
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  card: {
    margin: 16,
    marginBottom: 8,
    borderRadius: 12,
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginVertical: 10,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginTop: 5,
  },
  statLabel: {
    fontSize: 12,
    color: '#7f8c8d',
    marginTop: 2,
  },
  trendBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    marginTop: 15,
  },
  trendText: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: '600',
  },
  noDataContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  noDataText: {
    fontSize: 18,
    color: '#7f8c8d',
    marginTop: 15,
  },
  noDataSubtext: {
    fontSize: 14,
    color: '#95a5a6',
    marginTop: 5,
  },
  emptyTable: {
    paddingVertical: 30,
    alignItems: 'center',
  },
  emptyText: {
    color: '#95a5a6',
    fontSize: 14,
  },
  suggestionText: {
    fontSize: 14,
    color: '#2c3e50',
    lineHeight: 22,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 100,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#7f8c8d',
  },
});
