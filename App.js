import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Login from './src/Login';
import FuelSalesManagement from './src/FuelSalesManagement';

const Stack = createStackNavigator();

const App = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const checkLoginStatus = async () => {
      const token = await AsyncStorage.getItem('userToken');
      setIsLoggedIn(!!token);
    };

    checkLoginStatus();
  }, []);

  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName={isLoggedIn ? "FuelSalesManagement" : "Login"}>
        <Stack.Screen name="Login" component={Login} />
        <Stack.Screen name="FuelSalesManagement" component={FuelSalesManagement} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default App;
