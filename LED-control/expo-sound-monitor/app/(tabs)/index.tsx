import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, TextInput, SafeAreaView, ScrollView, StatusBar } from 'react-native';
import { Audio } from 'expo-av';
import { Mic, MicOff, Link, Unlink, Settings2, BarChart3 } from 'lucide-react-native';

const NUM_LEDS = 17;

export default function SoundClashApp() {
  const [db, setDb] = useState(0);
  const [minDb, setMinDb] = useState('45');
  const [maxDb, setMaxDb] = useState('120');
  const [ip, setIp] = useState('192.168.4.1');
  const [connected, setConnected] = useState(false);
  const [monitoring, setMonitoring] = useState(false);
  const [ledLevel, setLedLevel] = useState(0);

  const socketRef = useRef(null);
  const recordingRef = useRef(null);

  useEffect(() => {
    return () => {
      if (socketRef.current) socketRef.current.close();
      if (recordingRef.current) recordingRef.current.stopAndUnloadAsync();
    };
  }, []);

  const connect = () => {
    if (socketRef.current) {
      socketRef.current.close();
      socketRef.current = null;
      setConnected(false);
      return;
    }

    try {
      const ws = new WebSocket(`ws://${ip}:81`);
      ws.onopen = () => setConnected(true);
      ws.onclose = () => setConnected(false);
      ws.onerror = () => setConnected(false);
      socketRef.current = ws;
    } catch (e) {
      console.log('WS Connect Error:', e);
    }
  };

  const onRecordingStatusUpdate = (status) => {
    if (!status.isRecording || status.metering === undefined) return;

    // Metering is usually -160 to 0. 
    // We treat -60 as "silence" and 0 as "max".
    const metering = status.metering;
    const normalized = Math.max(0, Math.min(1, (metering + 60) / 60));

    const min = parseFloat(minDb) || 45;
    const max = parseFloat(maxDb) || 120;

    // Map to user's dB display range
    const currentDb = Math.round(min + normalized * (max - min));
    setDb(currentDb);

    // Map to LED count (0 to 17)
    let level = 0;
    if (currentDb >= min) {
      level = Math.round(((currentDb - min) / (max - min)) * NUM_LEDS);
    }
    level = Math.max(0, Math.min(NUM_LEDS, level));

    setLedLevel(level);

    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(level.toString());
    }
  };

  const toggleMonitoring = async () => {
    if (monitoring) {
      await recordingRef.current.stopAndUnloadAsync();
      recordingRef.current = null;
      setMonitoring(false);
      setLedLevel(0);
      setDb(0);
      return;
    }

    try {
      await Audio.requestPermissionsAsync();
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording } = await Audio.Recording.createAsync(
        {
          isMeteringEnabled: true,
          android: {
            extension: '.m4a',
            outputFormat: Audio.AndroidOutputFormat.MPEG_4,
            audioEncoder: Audio.AndroidAudioEncoder.AAC,
            sampleRate: 44100,
            numberOfChannels: 1,
            bitRate: 128000,
          },
          ios: {
            extension: '.m4a',
            outputFormat: Audio.IOSOutputFormat.MPEG4AAC,
            audioQuality: Audio.IOSAudioQuality.HIGH,
            sampleRate: 44100,
            numberOfChannels: 1,
            bitRate: 128000,
            linearPCMBitDepth: 16,
            linearPCMIsBigEndian: false,
            linearPCMIsFloat: false,
          },
        },
        onRecordingStatusUpdate,
        100 // update every 100ms
      );
      recordingRef.current = recording;
      setMonitoring(true);
    } catch (err) {
      console.error('Failed to start recording', err);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.title}>Sound <Text style={styles.accent}>Monitor</Text></Text>
          <Text style={styles.subtitle}>Wemos LED Controller</Text>
        </View>

        <View style={styles.card}>
          <View style={styles.inputRow}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Wemos IP</Text>
              <TextInput
                style={styles.input}
                value={ip}
                onChangeText={setIp}
                placeholder="192.168.4.1"
                placeholderTextColor="#64748b"
                keyboardType="numeric"
              />
            </View>
            <TouchableOpacity
              style={[styles.connectBtn, connected && styles.connectedBtn]}
              onPress={connect}
            >
              {connected ? <Unlink size={20} color="#0f172a" /> : <Link size={20} color="#0f172a" />}
              <Text style={styles.btnText}>{connected ? 'Disconnect' : 'Connect'}</Text>
            </TouchableOpacity>
          </View>
          <Text style={[styles.status, connected && styles.statusOn]}>
            {connected ? 'Connected to Wemos' : 'Disconnected'}
          </Text>
        </View>

        <View style={styles.card}>
          <View style={styles.thresholdRow}>
            <View style={styles.inputGroupSmall}>
              <Text style={styles.label}>Min (0 LEDs)</Text>
              <TextInput
                style={styles.input}
                value={minDb}
                onChangeText={setMinDb}
                keyboardType="numeric"
              />
            </View>
            <View style={styles.inputGroupSmall}>
              <Text style={styles.label}>Max (Full)</Text>
              <TextInput
                style={styles.input}
                value={maxDb}
                onChangeText={setMaxDb}
                keyboardType="numeric"
              />
            </View>
          </View>
        </View>

        <View style={styles.visualizerCard}>
          <View style={styles.dbContainer}>
            <Text style={styles.dbValue}>{db || '--'}</Text>
            <Text style={styles.dbUnit}>dB</Text>
          </View>

          <View style={styles.ledBar}>
            {Array.from({ length: NUM_LEDS }).map((_, i) => (
              <View
                key={i}
                style={[
                  styles.ledSegment,
                  i < ledLevel && (i < 8 ? styles.ledLow : i < 13 ? styles.ledMid : styles.ledHigh)
                ]}
              />
            ))}
          </View>
        </View>

        <TouchableOpacity
          style={[styles.mainBtn, monitoring && styles.activeMainBtn]}
          onPress={toggleMonitoring}
        >
          {monitoring ? <MicOff size={24} color="#fff" /> : <Mic size={24} color="#fff" />}
          <Text style={styles.mainBtnText}>{monitoring ? 'Stop Microphone' : 'Start Microphone'}</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  scrollContent: {
    padding: 24,
  },
  header: {
    marginBottom: 32,
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: -1,
  },
  accent: {
    color: '#38bdf8',
  },
  subtitle: {
    color: '#94a3b8',
    fontSize: 16,
    marginTop: 4,
  },
  card: {
    backgroundColor: 'rgba(30, 41, 59, 0.7)',
    borderRadius: 24,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  inputRow: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-end',
  },
  inputGroup: {
    flex: 1,
  },
  inputGroupSmall: {
    flex: 1,
  },
  label: {
    color: '#94a3b8',
    fontSize: 12,
    marginBottom: 8,
    marginLeft: 4,
  },
  input: {
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    borderRadius: 12,
    padding: 12,
    color: '#fff',
    fontSize: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  connectBtn: {
    backgroundColor: '#38bdf8',
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  connectedBtn: {
    backgroundColor: '#94a3b8',
  },
  btnText: {
    color: '#0f172a',
    fontWeight: '600',
  },
  status: {
    fontSize: 12,
    color: '#ef4444',
    marginTop: 12,
    textAlign: 'center',
  },
  statusOn: {
    color: '#22c55e',
  },
  thresholdRow: {
    flexDirection: 'row',
    gap: 16,
  },
  visualizerCard: {
    backgroundColor: 'rgba(30, 41, 59, 0.7)',
    borderRadius: 24,
    padding: 32,
    marginBottom: 32,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  dbContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 24,
  },
  dbValue: {
    fontSize: 72,
    fontWeight: '800',
    color: '#38bdf8',
  },
  dbUnit: {
    fontSize: 20,
    color: '#94a3b8',
    marginLeft: 8,
    fontWeight: '600',
  },
  ledBar: {
    flexDirection: 'row',
    gap: 3,
    height: 40,
    width: '100%',
    justifyContent: 'center',
  },
  ledSegment: {
    flex: 1,
    maxWidth: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 4,
  },
  ledLow: { backgroundColor: '#22c55e', shadowColor: '#22c55e', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.8, shadowRadius: 10, elevation: 10 },
  ledMid: { backgroundColor: '#eab308', shadowColor: '#eab308', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.8, shadowRadius: 10, elevation: 10 },
  ledHigh: { backgroundColor: '#ef4444', shadowColor: '#ef4444', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.8, shadowRadius: 10, elevation: 10 },
  mainBtn: {
    backgroundColor: '#38bdf8',
    borderRadius: 20,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    shadowColor: '#38bdf8',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 10,
  },
  activeMainBtn: {
    backgroundColor: '#ef4444',
    shadowColor: '#ef4444',
  },
  mainBtnText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '800',
  },
});
