import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, FlatList, StyleSheet, TouchableOpacity, SafeAreaView, StatusBar, Dimensions } from 'react-native';
import { Button, Overlay, Icon } from 'react-native-elements';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Picker } from '@react-native-picker/picker';
import { LinearGradient } from 'expo-linear-gradient';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Snackbar } from 'react-native-paper';
import { Animated } from 'react-native';

const API_BASE_URL = 'http://10.110.7.226:5000/api';
const MAIN_COLOR = '#007547';
const { width } = Dimensions.get('window');

const FuelSalesManagement = () => {
  const [sales, setSales] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [visibleSnackbar, setVisibleSnackbar] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [fadeAnim] = useState(new Animated.Value(0));

  const [currentSale, setCurrentSale] = useState({
    id: '',
    fuel_type: '',
    liters: '',
    sale_price_per_liter: '',
    sale_date: new Date(),
    payment_mode: '',
  });

  useEffect(() => {
    fetchSales();
    fetchInventory();
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: true,
    }).start();
  }, []);

  const fetchSales = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('userToken');
      const response = await axios.get(`${API_BASE_URL}/fuel-sales`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSales(response.data);
    } catch (error) {
      showSnackbar('Error fetching sales data');
    } finally {
      setLoading(false);
    }
  };

  const fetchInventory = async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      const response = await axios.get(`${API_BASE_URL}/inventory`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setInventory(response.data);
    } catch (error) {
      showSnackbar('Error fetching inventory');
    }
  };

  const handleSaveSale = async () => {
    if (!currentSale.fuel_type || !currentSale.liters || !currentSale.sale_price_per_liter || !currentSale.sale_date || !currentSale.payment_mode) {
      showSnackbar('Please fill in all fields.');
      return;
    }

    try {
      const token = await AsyncStorage.getItem('userToken');
      const saleData = { ...currentSale, sale_date: currentSale.sale_date.toISOString().split('T')[0] };

      if (currentSale.id) {
        await axios.put(`${API_BASE_URL}/fuel-sales/${currentSale.id}`, saleData, {
          headers: { Authorization: `Bearer ${token}` },
        });
      } else {
        await axios.post(`${API_BASE_URL}/fuel-sales`, saleData, {
          headers: { Authorization: `Bearer ${token}` },
        });
      }

      showSnackbar('Sale saved successfully');
      fetchSales();
      fetchInventory();
      setShowForm(false);
    } catch (error) {
      showSnackbar('Error saving sale');
    }
  };

  const handleDeleteSale = async (id) => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      await axios.delete(`${API_BASE_URL}/fuel-sales/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      showSnackbar('Sale deleted successfully');
      fetchSales();
    } catch (error) {
      showSnackbar('Error deleting sale');
    }
  };

  const handleInputChange = (field, value) => {
    setCurrentSale((prev) => ({ ...prev, [field]: value }));
  };

  const handleFuelTypeChange = (fuelType) => {
    const selectedFuel = inventory.find((item) => item.fuel_type === fuelType);
    const salePricePerLiter = selectedFuel ? selectedFuel.unit_price : '';

    setCurrentSale((prev) => ({
      ...prev,
      fuel_type: fuelType,
      sale_price_per_liter: salePricePerLiter,
    }));
  };

  const openForm = (sale = { id: '', fuel_type: '', liters: '', sale_price_per_liter: '', sale_date: new Date(), payment_mode: '' }) => {
    setCurrentSale(sale);
    setShowForm(true);
  };

  const showSnackbar = (message) => {
    setSnackbarMessage(message);
    setVisibleSnackbar(true);
  };

  const renderSaleItem = ({ item, index }) => (
    <Animated.View style={[styles.cardContainer, {
      opacity: fadeAnim,
      transform: [{
        translateY: fadeAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [50 * (index + 1), 0]
        })
      }]
    }]}>
      <LinearGradient
        colors={[MAIN_COLOR, '#009688']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.cardGradient}
      >
        <View style={styles.cardHeader}>
          <Icon name="local-gas-station" type="material" color="#fff" size={24} />
          <Text style={styles.cardTitle}>{item.fuel_type}</Text>
        </View>
        <View style={styles.cardContent}>
          <Text style={styles.cardText}>Liters: {item.liters}</Text>
          <Text style={styles.cardText}>Sale Price: {item.sale_price_per_liter} RWF</Text>
          <Text style={styles.cardText}>Date: {item.sale_date}</Text>
          <Text style={styles.cardText}>Payment: {item.payment_mode}</Text>
        </View>
        <View style={styles.cardActions}>          
        </View>
      </LinearGradient>
    </Animated.View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={MAIN_COLOR} />
      <LinearGradient colors={[MAIN_COLOR, '#009688']} style={styles.container}>
        <Text style={styles.title}>Fuel Sales Management</Text>
        <Button
  title="Record New Sale"
  onPress={() => openForm()}
  buttonStyle={styles.newSaleButton}
  titleStyle={{ color: '#007547' }} // Set the text color to black
  icon={<Icon name="add" type="material" color="#007547" size={20} style={{ marginRight: 10 }} />}
/>

        <Overlay isVisible={showForm} onBackdropPress={() => setShowForm(false)} overlayStyle={styles.overlay}>
          <Text style={styles.overlayTitle}>{currentSale.id ? 'Edit Sale' : 'Record New Sale'}</Text>
          <Picker
            selectedValue={currentSale.fuel_type}
            onValueChange={(itemValue) => handleFuelTypeChange(itemValue)}
            style={styles.picker}
          >
            <Picker.Item label="Select Fuel Type" value="" />
            {inventory.map((item) => (
              <Picker.Item key={item.id} label={item.fuel_type} value={item.fuel_type} />
            ))}
          </Picker>

          <TextInput
            style={styles.input}
            placeholder="Liters"
            placeholderTextColor="#999"
            keyboardType="numeric"
            value={currentSale.liters}
            onChangeText={(value) => handleInputChange('liters', value)}
          />
          <TextInput
            style={styles.input}
            placeholder="Sale Price per Liter"
            placeholderTextColor="#999"
            keyboardType="numeric"
            value={currentSale.sale_price_per_liter}
            editable={false}
          />
          <TouchableOpacity onPress={() => setShowDatePicker(true)} style={styles.datePickerButton}>
            <Text style={styles.datePickerButtonText}>
              {currentSale.sale_date.toISOString().split('T')[0]}
            </Text>
          </TouchableOpacity>
          {showDatePicker && (
            <DateTimePicker
              value={currentSale.sale_date}
              mode="date"
              display="default"
              onChange={(event, selectedDate) => {
                setShowDatePicker(false);
                if (selectedDate) {
                  handleInputChange('sale_date', selectedDate);
                }
              }}
            />
          )}
          <Picker
            selectedValue={currentSale.payment_mode}
            onValueChange={(itemValue) => handleInputChange('payment_mode', itemValue)}
            style={styles.picker}
          >
            <Picker.Item label="Select Payment Mode" value="" />
            <Picker.Item label="Cash" value="Cash" />
            <Picker.Item label="Card" value="Card" />
            <Picker.Item label="Mobile Money" value="Mobile Money" />
          </Picker>
          <Button
            title="Save"
            onPress={handleSaveSale}
            buttonStyle={styles.saveButton}
          />
        </Overlay>

        <FlatList
          data={sales}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderSaleItem}
          contentContainerStyle={styles.listContainer}
        />

        <Snackbar
          visible={visibleSnackbar}
          onDismiss={() => setVisibleSnackbar(false)}
          duration={3000}
          style={styles.snackbar}
        >
          {snackbarMessage}
        </Snackbar>
      </LinearGradient>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: MAIN_COLOR,
  },
  container: {
    flex: 1,
    padding: 16,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#ffffff',
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  newSaleButton: {
    backgroundColor: '#ffffff',
    borderRadius: 25,
    paddingVertical: 12,
    marginBottom: 20,
  },
  overlay: {
    width: width * 0.9,
    padding: 20,
    borderRadius: 15,
    backgroundColor: '#ffffff',
  },
  overlayTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: MAIN_COLOR,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    backgroundColor: '#f5f5f5',
    padding: 12,
    marginBottom: 15,
    borderRadius: 8,
    fontSize: 16,
    color: '#333',
  },
  datePickerButton: {
    backgroundColor: '#f5f5f5',
    padding: 12,
    marginBottom: 15,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  datePickerButtonText: {
    fontSize: 16,
    color: '#333',
  },
  picker: {
    height: 50,
    marginBottom: 15,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
  },
  saveButton: {
    backgroundColor: MAIN_COLOR,
    borderRadius: 8,
    paddingVertical: 12,
    marginTop: 10,
  },
  listContainer: {
    paddingBottom: 20,
  },
  cardContainer: {
    marginBottom: 15,
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 5,
  },
  cardGradient: {
    padding: 15,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginLeft: 10,
    color: '#ffffff',
  },
  cardContent: {
    marginLeft: 5,
  },
  cardText: {
    fontSize: 16,
    marginBottom: 5,
    color: '#ffffff',
  },
  cardActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 10,
  },
  actionButton: {
    padding: 5,
    marginLeft: 10,
  },
  snackbar: {
    backgroundColor: '#333',
  },
});

export default FuelSalesManagement;