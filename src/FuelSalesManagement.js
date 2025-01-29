import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Dimensions,
  Modal,
  ActivityIndicator,
  Platform,
  Animated,
  KeyboardAvoidingView
} from 'react-native';
import { Button, Icon } from 'react-native-elements';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Snackbar } from 'react-native-paper';
import RNPickerSelect from 'react-native-picker-select';

const API_BASE_URL = 'http://10.110.7.226:5000/api';
const MAIN_COLOR = Platform.select({
  ios: '#007AFF',
  android: '#007547'
});
const SECONDARY_COLOR = Platform.select({
  ios: '#5856D6',
  android: '#1976D2'
});
const { width } = Dimensions.get('window');

const FuelSalesManagement = () => {
  // State Management
  const [sales, setSales] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [visibleSnackbar, setVisibleSnackbar] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [filterFuelType, setFilterFuelType] = useState('');
  const [filteredSales, setFilteredSales] = useState([]);
  const [modalAnimation] = useState(new Animated.Value(0));
  const [currentSale, setCurrentSale] = useState({
    id: '',
    fuel_type: '',
    liters: '',
    sale_price_per_liter: '',
    sale_date: new Date(),
    payment_mode: '',
  });
  const [branchId, setBranchId] = useState('');

  // Effect Hooks
  useEffect(() => {
    fetchBranchId();
  }, []);

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

  // API Functions
  const fetchBranchId = async () => {
    try {
      const storedBranchId = await AsyncStorage.getItem('branch');
      if (storedBranchId) {
        setBranchId(storedBranchId);
      } else {
        showSnackbar('Branch ID not found');
      }
    } catch (error) {
      showSnackbar('Error fetching branch ID');
    }
  };

  const fetchSales = async () => {
    if (!branchId) return;
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('userToken');
      const response = await axios.get(`${API_BASE_URL}/fuel-sales/branch/${branchId}`, {
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
    if (!branchId) return;
    try {
      const token = await AsyncStorage.getItem('userToken');
      const response = await axios.get(`${API_BASE_URL}/inventory/branch/${branchId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setInventory(response.data);
    } catch (error) {
      showSnackbar('Error fetching inventory');
    }
  };

  // Form Handling Functions
  const handleSaveSale = async () => {
    if (!currentSale.fuel_type || !currentSale.liters || !currentSale.sale_price_per_liter || !currentSale.sale_date || !currentSale.payment_mode) {
      showSnackbar('Please fill in all fields.');
      return;
    }

    try {
      const token = await AsyncStorage.getItem('userToken');
      const saleData = {
        ...currentSale,
        branch_id: branchId,
        sale_date: currentSale.sale_date.toISOString().split('T')[0]
      };

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
      handleCloseForm();
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

  // Modal Functions
  const openForm = (sale = {
    id: '',
    fuel_type: '',
    liters: '',
    sale_price_per_liter: '',
    sale_date: new Date(),
    payment_mode: ''
  }) => {
    setCurrentSale(sale);
    setShowForm(true);
    Animated.spring(modalAnimation, {
      toValue: 1,
      useNativeDriver: true,
      tension: 50,
      friction: 7
    }).start();
  };

  const handleCloseForm = () => {
    Animated.spring(modalAnimation, {
      toValue: 0,
      useNativeDriver: true,
      tension: 50,
      friction: 7
    }).start(() => setShowForm(false));
  };

  const showSnackbar = (message) => {
    setSnackbarMessage(message);
    setVisibleSnackbar(true);
  };

  // Render Card Item
  const renderSaleItem = ({ item }) => (
    <Animated.View style={styles.cardWrapper}>
      <LinearGradient
        colors={[MAIN_COLOR, SECONDARY_COLOR]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.cardContainer}
      >
        <View style={styles.cardHeader}>
          <Icon 
            name={Platform.OS === 'ios' ? 'ios-gas-pump' : 'local-gas-station'} 
            type={Platform.OS === 'ios' ? 'ionicon' : 'material'} 
            color="#fff" 
            size={24} 
          />
          <Text style={styles.cardTitle}>{item.fuel_type}</Text>
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => handleDeleteSale(item.id)}
          >
            <Icon 
              name={Platform.OS === 'ios' ? 'ios-trash' : 'delete'} 
              type={Platform.OS === 'ios' ? 'ionicon' : 'material'} 
              color="#fff" 
              size={20} 
            />
          </TouchableOpacity>
        </View>
        <View style={styles.cardContent}>
          <View style={styles.cardRow}>
            <Text style={styles.cardLabel}>Liters:</Text>
            <Text style={styles.cardValue}>{item.liters}</Text>
          </View>
          <View style={styles.cardRow}>
            <Text style={styles.cardLabel}>Price/L:</Text>
            <Text style={styles.cardValue}>{item.sale_price_per_liter} RWF</Text>
          </View>
          <View style={styles.cardRow}>
  <Text style={styles.cardLabel}>Date:</Text>
  <Text style={styles.cardValue}>
    {new Date(item.sale_date).toLocaleDateString()}
  </Text>
</View>

          <View style={styles.cardRow}>
            <Text style={styles.cardLabel}>Payment:</Text>
            <Text style={styles.cardValue}>{item.payment_mode}</Text>
          </View>
        </View>
      </LinearGradient>
    </Animated.View>
  );

  const modalScale = modalAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [0.9, 1]
  });

  // Main Render
  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={MAIN_COLOR} />
      <LinearGradient colors={[MAIN_COLOR, SECONDARY_COLOR]} style={styles.container}>
        <Text style={styles.title}>Fuel Sales</Text>

        <TouchableOpacity
          style={styles.newSaleButton}
          onPress={() => openForm()}
          activeOpacity={0.8}
        >
          <Icon 
            name={Platform.OS === 'ios' ? 'ios-add' : 'add'} 
            type={Platform.OS === 'ios' ? 'ionicon' : 'material'} 
            color={MAIN_COLOR} 
            size={24} 
          />
          <Text style={styles.newSaleButtonText}>New Sale</Text>
        </TouchableOpacity>

        <View style={styles.filterContainer}>
          <RNPickerSelect
            onValueChange={(value) => setFilterFuelType(value)}
            items={inventory.map((item) => ({
              label: item.fuel_type,
              value: item.fuel_type
            }))}
            placeholder={{ label: 'Filter by Fuel Type', value: '' }}
            style={pickerSelectStyles}
            useNativeAndroidPickerStyle={false}
          />
        </View>

        {loading ? (
          <ActivityIndicator size="large" color="#fff" style={styles.loader} />
        ) : (
          <FlatList
            data={filteredSales}
            keyExtractor={(item) => item.id.toString()}
            renderItem={renderSaleItem}
            contentContainerStyle={styles.listContainer}
            showsVerticalScrollIndicator={false}
          />
        )}

        <Modal
          transparent={true}
          visible={showForm}
          animationType="none"
          onRequestClose={handleCloseForm}
        >
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.modalBackground}
          >
            <Animated.View
              style={[
                styles.modalContainer,
                {
                  transform: [{ scale: modalScale }],
                }
              ]}
            >
              <Text style={styles.overlayTitle}>
                {currentSale.id ? 'Edit Sale' : 'New Sale'}
              </Text>

              <RNPickerSelect
                onValueChange={handleFuelTypeChange}
                items={inventory.map((item) => ({
                  label: item.fuel_type,
                  value: item.fuel_type
                }))}
                placeholder={{ label: 'Select Fuel Type', value: null }}
                style={pickerSelectStyles}
                useNativeAndroidPickerStyle={false}
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
                style={[styles.input, styles.disabledInput]}
                placeholder="Sale Price per Liter"
                placeholderTextColor="#999"
                value={currentSale.sale_price_per_liter}
                editable={false}
              />

              <TouchableOpacity
                onPress={() => setShowDatePicker(true)}
                style={styles.datePickerButton}
              >
                <Text style={styles.datePickerButtonText}>
                  {currentSale.sale_date.toISOString().split('T')[0]}
                </Text>
                <Icon 
                  name={Platform.OS === 'ios' ? 'ios-calendar' : 'calendar'} 
                  type={Platform.OS === 'ios' ? 'ionicon' : 'material'} 
                  size={20} 
                  color={MAIN_COLOR} 
                />
              </TouchableOpacity>

              {showDatePicker && (
                <DateTimePicker
                  value={currentSale.sale_date}
                  mode="date"
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
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
                style={pickerSelectStyles}
                useNativeAndroidPickerStyle={false}
              />

              <View style={styles.modalButtons}>
                <TouchableOpacity
               style={[styles.modalButton, styles.saveButton]} 
               onPress={handleSaveSale}
             >
               <Text style={styles.buttonText}>Save</Text>
             </TouchableOpacity>
             
             <TouchableOpacity 
               style={[styles.modalButton, styles.cancelButton]} 
               onPress={handleCloseForm}
             >
               <Text style={[styles.buttonText, styles.cancelButtonText]}>Cancel</Text>
             </TouchableOpacity>
             
              </View>
            </Animated.View>
          </KeyboardAvoidingView>
        </Modal>

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
    fontSize: Platform.OS === 'ios' ? 34 : 28,
    fontWeight: Platform.OS === 'ios' ? '700' : 'bold',
    marginBottom: 20,
    color: '#ffffff',
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  filterContainer: {
    marginBottom: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    overflow: 'hidden',
  },
  newSaleButton: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    padding: Platform.OS === 'ios' ? 12 : 10,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 20,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  newSaleButtonText: {
    color: MAIN_COLOR,
    fontSize: Platform.OS === 'ios' ? 17 : 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
  },
  listContainer: {
    paddingBottom: 20,
  },
  cardWrapper: {
    marginBottom: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 6,
      },
      android: {
        elevation: 5,
      },
    }),
  },
  cardContainer: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  cardTitle: {
    flex: 1,
    color: '#fff',
    fontSize: Platform.OS === 'ios' ? 20 : 18,
    fontWeight: '600',
    marginLeft: 12,
  },
  deleteButton: {
    padding: 4,
  },
  cardContent: {
    padding: 16,
  },
  cardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardLabel: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: Platform.OS === 'ios' ? 15 : 14,
    fontWeight: '500',
  },
  cardValue: {
    color: '#fff',
    fontSize: Platform.OS === 'ios' ? 16 : 15,
    fontWeight: '600',
  },
  modalBackground: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContainer: {
    width: width * 0.9,
    backgroundColor: '#ffffff',
    borderRadius: Platform.OS === 'ios' ? 20 : 16,
    padding: 24,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.25,
        shadowRadius: 12,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  overlayTitle: {
    fontSize: Platform.OS === 'ios' ? 24 : 22,
    fontWeight: Platform.OS === 'ios' ? '700' : 'bold',
    color: '#000',
    textAlign: 'center',
    marginBottom: 24,
  },
  input: {
    height: Platform.OS === 'ios' ? 48 : 46,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    fontSize: Platform.OS === 'ios' ? 17 : 16,
    color: '#000',
  },
  disabledInput: {
    backgroundColor: '#F2F2F7',
  },
  datePickerButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    height: Platform.OS === 'ios' ? 48 : 46,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
  },
  datePickerButtonText: {
    fontSize: Platform.OS === 'ios' ? 17 : 16,
    color: '#000',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 24,
  },
  submitButton: {
    height: Platform.OS === 'ios' ? 54 : 50,
    borderRadius: 12,
    backgroundColor: '#4CAF50',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    marginBottom: 12,
    paddingHorizontal: 20,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  submitButton: {
    backgroundColor: '#4CAF50', // Green color for submit
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  submitButtonText: {
    fontSize: Platform.OS === 'ios' ? 18 : 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginLeft: 8,
  },
  submitIcon: {
    marginRight: 8,
  },
  closeButton: {
    marginTop: 16,
    padding: 12,
    alignItems: 'center',
  },
  closeButtonText: {
    color: '#666',
    fontSize: Platform.OS === 'ios' ? 16 : 14,
    fontWeight: '500',
  },
  snackbar: {
    backgroundColor: '#323232',
    borderRadius: 8,
    marginBottom: 20,
  },
});

const pickerSelectStyles = StyleSheet.create({
  inputIOS: {
    fontSize: 17,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    borderRadius: 12,
    color: '#000',
    backgroundColor: '#FFFFFF',
    paddingRight: 30,
  },
  inputAndroid: {
    fontSize: 16,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    borderRadius: 12,
    color: '#000',
    backgroundColor: '#FFFFFF',
    paddingRight: 30,
  },
});

export default FuelSalesManagement;
                 