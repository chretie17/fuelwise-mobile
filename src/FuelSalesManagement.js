import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, FlatList, StyleSheet, TouchableOpacity, SafeAreaView, StatusBar, Dimensions, Modal } from 'react-native';
import { Button, Icon } from 'react-native-elements';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Snackbar } from 'react-native-paper';
import RNPickerSelect from 'react-native-picker-select';

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
  const [filterFuelType, setFilterFuelType] = useState('');
  const [filteredSales, setFilteredSales] = useState([]);
  const [currentSale, setCurrentSale] = useState({
    id: '',
    fuel_type: '',
    liters: '',
    sale_price_per_liter: '',
    sale_date: new Date(),
    payment_mode: '',
  });
  const [branchId, setBranchId] = useState('');

  // Fetch the branchId from AsyncStorage when the component mounts
  useEffect(() => {
    fetchBranchId();
  }, []);

  // Fetch inventory and sales for the logged-in user's branch
  useEffect(() => {
    if (branchId) {
      fetchSales();
      fetchInventory();
    }
  }, [branchId]);

  useEffect(() => {
    if (filterFuelType) {
      setFilteredSales(sales.filter((sale) => sale.fuel_type === filterFuelType));
    } else {
      setFilteredSales(sales);
    }
  }, [filterFuelType, sales]);

  // Fetch branch ID from AsyncStorage
  // Fetch branch ID from AsyncStorage
const fetchBranchId = async () => {
  try {
    const storedBranchId = await AsyncStorage.getItem('branch');
    console.log('Stored Branch ID:', storedBranchId);  // <-- Log the branch ID
    if (storedBranchId) {
      setBranchId(storedBranchId);
    } else {
      showSnackbar('Branch ID not found');
    }
  } catch (error) {
    showSnackbar('Error fetching branch ID');
    console.log('Error fetching branch ID:', error);  // <-- Log error
  }
};


  // Fetch sales for the user's branch
  // Fetch sales for the user's branch
const fetchSales = async () => {
  if (!branchId) return;
  try {
    setLoading(true);
    const token = await AsyncStorage.getItem('userToken');
    console.log('User Token:', token);  // <-- Log the token
    console.log('Branch ID for fetching sales:', branchId);  // <-- Log the branchId

    const response = await axios.get(`${API_BASE_URL}/fuel-sales/branch/${branchId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    console.log('Sales Data:', response.data);  // <-- Log the response data
    setSales(response.data);
  } catch (error) {
    showSnackbar('Error fetching sales data');
    console.log('Error fetching sales:', error);  // <-- Log error
  } finally {
    setLoading(false);
  }
};

// Fetch inventory for the user's branch
const fetchInventory = async () => {
  if (!branchId) return;
  try {
    const token = await AsyncStorage.getItem('userToken');
    console.log('User Token:', token);  // <-- Log the token
    console.log('Branch ID for fetching inventory:', branchId);  // <-- Log the branchId

    const response = await axios.get(`${API_BASE_URL}/inventory/branch/${branchId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    console.log('Inventory Data:', response.data);  // <-- Log the response data
    setInventory(response.data);
  } catch (error) {
    showSnackbar('Error fetching inventory');
    console.log('Error fetching inventory:', error);  // <-- Log error
  }
};


  const handleSaveSale = async () => {
    if (!currentSale.fuel_type || !currentSale.liters || !currentSale.sale_price_per_liter || !currentSale.sale_date || !currentSale.payment_mode) {
      showSnackbar('Please fill in all fields.');
      return;
    }

    try {
      const token = await AsyncStorage.getItem('userToken');
      const saleData = { ...currentSale, branch_id: branchId, sale_date: currentSale.sale_date.toISOString().split('T')[0] };

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

  const renderSaleItem = ({ item }) => (
    <LinearGradient
      colors={[MAIN_COLOR, '#009688']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.cardContainer}
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
    </LinearGradient>
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
          titleStyle={{ color: '#007547' }}
          icon={<Icon name="add" type="material" color="#007547" size={20} style={{ marginRight: 10 }} />}
        />

        <RNPickerSelect
          onValueChange={(value) => setFilterFuelType(value)}
          items={inventory.map((item) => ({ label: item.fuel_type, value: item.fuel_type }))}
          placeholder={{ label: 'Filter by Fuel Type', value: '' }}
          style={{ inputIOS: styles.picker, inputAndroid: styles.picker }}
        />

        <Modal transparent={true} animationType="slide" visible={showForm} onRequestClose={() => setShowForm(false)}>
          <View style={styles.modalBackground}>
            <View style={styles.modalContainer}>
              <Text style={styles.overlayTitle}>{currentSale.id ? 'Edit Sale' : 'Record New Sale'}</Text>
              <RNPickerSelect
                onValueChange={(value) => handleFuelTypeChange(value)}
                items={inventory.map((item) => ({ label: item.fuel_type, value: item.fuel_type }))}
                placeholder={{ label: 'Select Fuel Type', value: null }}
                style={{ inputIOS: styles.picker, inputAndroid: styles.picker }}
              />

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
              <RNPickerSelect
                onValueChange={(value) => handleInputChange('payment_mode', value)}
                items={[
                  { label: 'Cash', value: 'Cash' },
                  { label: 'Card', value: 'Card' },
                  { label: 'Mobile Money', value: 'Mobile Money' },
                ]}
                placeholder={{ label: 'Select Payment Mode', value: null }}
                style={{ inputIOS: styles.picker, inputAndroid: styles.picker }}
              />
              <Button title="Save" onPress={handleSaveSale} buttonStyle={styles.saveButton} />
              <Button title="Close" onPress={() => setShowForm(false)} buttonStyle={styles.closeButton} />
            </View>
          </View>
        </Modal>

        <FlatList
          data={filteredSales}
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
  modalBackground: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContainer: {
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
    borderWidth: 1,
    borderColor: '#e0e0e0',
    backgroundColor: '#f5f5f5',
    padding: 12,
    marginBottom: 15,
    borderRadius: 8,
    fontSize: 16,
    color: '#333',
  },
  saveButton: {
    backgroundColor: MAIN_COLOR,
    borderRadius: 8,
    paddingVertical: 12,
    marginTop: 10,
  },
  closeButton: {
    backgroundColor: '#ccc',
    borderRadius: 8,
    paddingVertical: 12,
    marginTop: 10,
  },
});
export default FuelSalesManagement;
