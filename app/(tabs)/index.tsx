import { Keyboard, TouchableWithoutFeedback, Animated, View, Text, Button, StyleSheet, TextInput } from 'react-native';
import { useState, useRef } from 'react';
import * as Speech from 'expo-speech';
import { Picker } from '@react-native-picker/picker';

export default function HomeScreen() {
  const [hours, setHours] = useState(0);
  const [minutes, setMinutes] = useState(0);
  const [seconds, setSeconds] = useState<number>(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [message, setMessage] = useState<string>('');
  const [running, setRunning] = useState<boolean>(false);

  const hoursArray = Array.from({length: 24 }, (_, i) => i)
  const minutesArray = Array.from({length:60}, (_, i) => i)
  const secondsArray = Array.from({length:60}, (_, i) => i)

  const intervalRef = useRef<number | null>(null);
  const anim = useRef(new Animated.Value(0)).current; // animated value for circle

  const startTimer = () => {
    if (!message) return;

    const totalSeconds = hours * 3600 + minutes * 60 + seconds;
    if (totalSeconds <= 0) return;
    setTimeLeft(totalSeconds);
    setRunning(true);

    let remaining = totalSeconds;
intervalRef.current = setInterval(() => {
  remaining -= 1;
  setTimeLeft(remaining);
  anim.setValue(1 - remaining / totalSeconds);

  if (remaining <= 0) {
    clearInterval(intervalRef.current!);
    setRunning(false);
    Speech.speak(message, { volume: 1.0, pitch: 1.2, rate: 1.0 });
  }
}, 1000);
  };

  const resetTimer = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setRunning(false);
    setHours(0);
    setMinutes(0);
    setSeconds(0);
    setTimeLeft(0);
    setMessage('');
    anim.setValue(0); // reset animation
  };

  // Interpolate color from bright red to dark red
  const circleColor = anim.interpolate({
    inputRange: [0, 1],
    outputRange: ['#800000', '#FF4D4D',],
  });

  return (


  

    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
  <View style={styles.container}>
    
    {/* Circle + Timer */}
    <Animated.View style={[styles.circle, { borderColor: circleColor }]}>
      <Text style={styles.timer}>{timeLeft}s</Text>
    </Animated.View>
    
    {/* Bottom inputs/buttons */}
    <View style={styles.bottom}>
      <TextInput
        style={[styles.input, { height: 100 }]}
        placeholder="Enter message..."
        placeholderTextColor="gray"
        value={message}
        onChangeText={setMessage}
        multiline
        textAlignVertical="top"
      />

      <View style={{ flexDirection: 'row', justifyContent: 'space-around', width: 250, marginTop: 10 }}>
  <Button
    title={running ? 'Running...' : 'Start'}
    disabled={running || !message || (hours + minutes + seconds === 0)}
    onPress={startTimer}
    color="red"
  />

  <Button
    title="Reset"
    onPress={resetTimer}
    color="red"
  />
</View>
    </View>
    <View style = {{ flexDirection: 'row', justifyContent: 'space-around', width: '100%'}}>
{/* Hours */}
  <Picker
    selectedValue={hours}
    style={{ width: 100, color: 'red', backgroundColor: '#222' }}
    onValueChange={(value) => setHours(value)}
  >
    {Array.from({ length: 24 }, (_, i) => (
      <Picker.Item key={i} label={i.toString()} value={i} color="red"/>
    ))}
  </Picker>

  {/* Minutes */}
  <Picker
    selectedValue={minutes}
    style={{ width: 100, color: 'red', backgroundColor: '#222' }}
    onValueChange={(value) => setMinutes(value)}
  >
    {Array.from({ length: 60 }, (_, i) => (
      <Picker.Item key={i} label={i.toString()} value={i} color="red"/>
    ))}
  </Picker>

  {/* Seconds */}
  <Picker
    selectedValue={seconds}
    style={{ width: 100, color: 'red', backgroundColor: '#222' }}
    onValueChange={(value) => setSeconds(value)}
  >
    {Array.from({ length: 60 }, (_, i) => (
      <Picker.Item key={i} label={i.toString()} value={i} color="red"/>
    ))}
  </Picker>
      
    </View>
  </View>
</TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-start', 
    backgroundColor: 'black',
    paddingTop: 45,
  },
  circle: {
    width: 300,
    height: 300,
    borderRadius: 150,
    borderWidth: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  timer: {
    fontSize: 48,
    color: 'red',
    marginBottom: 20,
  },
  input: {
    width: 350,
    borderColor: 'red',
    borderWidth: 3,
    paddingHorizontal: 50,
    paddingVertical: 5,
    marginBottom: 5,
    color: 'white',
    backgroundColor: '#222',
  },
  bottom: {
    alignItems: 'center',
    marginBottom: 20,
    backgroundColor: 'black',
    height: 170,
    width: '100%',
  },
});