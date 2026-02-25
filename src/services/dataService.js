// Data Service - Handles all data operations with JSON files
import customersData from '../data/customers.json';
import employeesData from '../data/employees.json';
import visitsData from '../data/visits.json';
import { getCurrentTimestamp } from '../utils/dateUtils.js';

class DataService {
  constructor() {
    // Load data into memory for faster access
    this.customers = [...customersData];
    this.employees = [...employeesData];
    this.visits = [...visitsData];
    
    // Generate unique IDs counter
    this.nextVisitId = this.visits.length + 1;
    this.nextCustomerId = Math.max(...this.customers.map(c => parseInt(c.customerId))) + 1;
  }

  // Customer operations
  getAllCustomers() {
    return [...this.customers];
  }

  getCustomerById(customerId) {
    return this.customers.find(customer => customer.customerId === customerId);
  }

  getCustomersByName(searchTerm) {
    const term = searchTerm.toLowerCase();
    return this.customers.filter(customer => {
      const fullName = `${customer.personalInfo.firstName} ${customer.personalInfo.lastName}`.toLowerCase();
      return fullName.includes(term) || 
             customer.personalInfo.firstName.toLowerCase().includes(term) ||
             customer.personalInfo.lastName.toLowerCase().includes(term);
    });
  }

  addCustomer(customerData) {
    const newCustomer = {
      ...customerData,
      customerId: customerData.customerId || this.nextCustomerId.toString().padStart(8, '0'),
      currentVisit: {
        isInside: false,
        entryTime: null,
        exitTime: null
      }
    };
    
    this.customers.push(newCustomer);
    this.nextCustomerId++;
    
    return newCustomer;
  }

  updateCustomer(customerId, updates) {
    const index = this.customers.findIndex(c => c.customerId === customerId);
    if (index === -1) {
      throw new Error('Customer not found');
    }
    
    this.customers[index] = { ...this.customers[index], ...updates };
    return this.customers[index];
  }

  updateCustomerVisitStatus(customerId, isInside, entryTime = null, exitTime = null) {
    const customer = this.getCustomerById(customerId);
    if (!customer) {
      throw new Error('Customer not found');
    }
    
    customer.currentVisit = {
      isInside,
      entryTime,
      exitTime
    };
    
    return customer;
  }

  // Employee operations
  getAllEmployees() {
    return [...this.employees];
  }

  getEmployeeById(employeeId) {
    return this.employees.find(employee => employee.employeeId === employeeId);
  }

  getEmployeeByUsername(username) {
    return this.employees.find(employee => employee.username === username);
  }

  validateEmployeeCredentials(username, password) {
    const employee = this.getEmployeeByUsername(username);
    return employee && employee.password === password && employee.isActive;
  }

  // Visit operations
  getAllVisits() {
    return [...this.visits];
  }

  getVisitById(visitId) {
    return this.visits.find(visit => visit.visitId === visitId);
  }

  getVisitsByCustomerId(customerId) {
    return this.visits.filter(visit => visit.customerId === customerId);
  }

  getVisitsByDate(date) {
    return this.visits.filter(visit => visit.date === date);
  }

  getVisitsByDateRange(startDate, endDate) {
    return this.visits.filter(visit => {
      const visitDate = new Date(visit.date);
      const start = new Date(startDate);
      const end = new Date(endDate);
      return visitDate >= start && visitDate <= end;
    });
  }

  getCurrentVisits() {
    return this.visits.filter(visit => visit.exitTime === null);
  }

  addVisit(visitData) {
    const newVisit = {
      visitId: `visit${this.nextVisitId.toString().padStart(3, '0')}`,
      customerId: visitData.customerId,
      entryTime: visitData.entryTime || getCurrentTimestamp(),
      exitTime: visitData.exitTime || null,
      duration: visitData.duration || null,
      services: visitData.services || [],
      date: visitData.date || new Date().toISOString().split('T')[0]
    };
    
    this.visits.push(newVisit);
    this.nextVisitId++;
    
    return newVisit;
  }

  updateVisit(visitId, updates) {
    const index = this.visits.findIndex(v => v.visitId === visitId);
    if (index === -1) {
      throw new Error('Visit not found');
    }
    
    this.visits[index] = { ...this.visits[index], ...updates };
    return this.visits[index];
  }

  endVisit(visitId, exitTime = null) {
    const visit = this.getVisitById(visitId);
    if (!visit) {
      throw new Error('Visit not found');
    }
    
    const endTime = exitTime || getCurrentTimestamp();
    const startTime = new Date(visit.entryTime);
    const endTimeDate = new Date(endTime);
    const durationMinutes = Math.floor((endTimeDate - startTime) / (1000 * 60));
    
    visit.exitTime = endTime;
    visit.duration = durationMinutes;
    
    return visit;
  }

  // Statistics operations
  getVisitStatsByDate(date) {
    const visits = this.getVisitsByDate(date);
    const completedVisits = visits.filter(v => v.exitTime !== null);
    
    return {
      totalVisits: visits.length,
      completedVisits: completedVisits.length,
      currentlyInside: visits.length - completedVisits.length,
      totalDuration: completedVisits.reduce((sum, v) => sum + (v.duration || 0), 0),
      averageDuration: completedVisits.length > 0 
        ? Math.round(completedVisits.reduce((sum, v) => sum + (v.duration || 0), 0) / completedVisits.length)
        : 0
    };
  }

  getHourlyVisitStats(date) {
    const visits = this.getVisitsByDate(date);
    const hourlyStats = {};
    
    // Initialize all hours
    for (let hour = 0; hour < 24; hour++) {
      hourlyStats[hour] = { entries: 0, exits: 0 };
    }
    
    visits.forEach(visit => {
      // Count entries
      const entryHour = new Date(visit.entryTime).getHours();
      hourlyStats[entryHour].entries++;
      
      // Count exits
      if (visit.exitTime) {
        const exitHour = new Date(visit.exitTime).getHours();
        hourlyStats[exitHour].exits++;
      }
    });
    
    return hourlyStats;
  }

  getMembershipTypeStats(date) {
    const visits = this.getVisitsByDate(date);
    const stats = {
      daily: 0,
      monthly: 0,
      annual: 0
    };
    
    visits.forEach(visit => {
      const customer = this.getCustomerById(visit.customerId);
      if (customer && customer.membership) {
        const type = customer.membership.type;
        if (stats.hasOwnProperty(type)) {
          stats[type]++;
        }
      }
    });
    
    return stats;
  }

  getServiceStats(date) {
    const visits = this.getVisitsByDate(date);
    const stats = {
      gym: 0,
      spa: 0,
      both: 0
    };
    
    visits.forEach(visit => {
      if (visit.services.includes('gym') && visit.services.includes('spa')) {
        stats.both++;
      } else if (visit.services.includes('gym')) {
        stats.gym++;
      } else if (visit.services.includes('spa')) {
        stats.spa++;
      }
    });
    
    return stats;
  }

  // Search operations
  searchCustomers(query) {
    const searchTerm = query.toLowerCase();
    return this.customers.filter(customer => {
      return customer.customerId.includes(searchTerm) ||
             customer.personalInfo.firstName.toLowerCase().includes(searchTerm) ||
             customer.personalInfo.lastName.toLowerCase().includes(searchTerm) ||
             customer.personalInfo.email.toLowerCase().includes(searchTerm) ||
             customer.personalInfo.phone.includes(searchTerm);
    });
  }

  // Current visitors operations
  getCurrentVisitors() {
    return this.customers
      .filter(customer => customer.currentVisit && customer.currentVisit.isInside)
      .map(customer => {
        const currentVisit = this.visits.find(v => 
          v.customerId === customer.customerId && 
          v.exitTime === null
        );
        
        return {
          ...customer,
          currentVisitData: currentVisit
        };
      });
  }

  getVisitorCount() {
    return this.getCurrentVisitors().length;
  }

  // Data persistence (in a real app, this would save to files/database)
  saveData() {
    // In a real application, this would persist data to files or database
    console.log('Data saved successfully');
    return Promise.resolve(true);
  }

  // Data reset (for testing purposes)
  resetData() {
    this.customers = [...customersData];
    this.employees = [...employeesData];
    this.visits = [...visitsData];
    
    this.nextVisitId = this.visits.length + 1;
    this.nextCustomerId = Math.max(...this.customers.map(c => parseInt(c.customerId))) + 1;
  }

  // Validation helpers
  isCustomerIdUnique(customerId) {
    return !this.customers.some(c => c.customerId === customerId);
  }

  isUsernameUnique(username) {
    return !this.employees.some(e => e.username === username);
  }

  // Export data (for reports)
  exportCustomersData() {
    return {
      data: this.getAllCustomers(),
      timestamp: getCurrentTimestamp(),
      total: this.customers.length
    };
  }

  exportVisitsData(startDate = null, endDate = null) {
    const visits = startDate && endDate 
      ? this.getVisitsByDateRange(startDate, endDate)
      : this.getAllVisits();
      
    return {
      data: visits,
      timestamp: getCurrentTimestamp(),
      total: visits.length,
      dateRange: { startDate, endDate }
    };
  }

  exportStatisticsData(date) {
    return {
      visitStats: this.getVisitStatsByDate(date),
      hourlyStats: this.getHourlyVisitStats(date),
      membershipStats: this.getMembershipTypeStats(date),
      serviceStats: this.getServiceStats(date),
      currentVisitors: this.getCurrentVisitors(),
      date,
      timestamp: getCurrentTimestamp()
    };
  }
}

// Create singleton instance
const dataService = new DataService();

export default dataService;