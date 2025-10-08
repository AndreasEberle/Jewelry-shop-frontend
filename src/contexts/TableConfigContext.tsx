'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import api from '@/services/api'

interface TableSortConfig {
  column: string
  direction: 'asc' | 'desc'
}

interface TableColumnConfig {
  visible: string[]
}

interface TableConfig {
  users: TableSortConfig & TableColumnConfig
  orders: TableSortConfig & TableColumnConfig
  products: TableSortConfig & TableColumnConfig
  payments: TableSortConfig & TableColumnConfig
}

interface TableConfigContextType {
  config: TableConfig
  loading: boolean
  updateTableConfig: (tableName: keyof TableConfig, config: Partial<TableSortConfig & TableColumnConfig>) => Promise<void>
  getTableConfig: (tableName: keyof TableConfig) => TableSortConfig & TableColumnConfig
}

const defaultConfig: TableConfig = {
  users: { 
    column: 'created', 
    direction: 'desc',
    visible: ['user', 'contact', 'roles', 'status', 'authType', 'newsletter', 'emailVerified', 'profileCompleted', 'language', 'currency', 'lastLogin', 'created', 'actions']
  },
  orders: { 
    column: 'createdAt', 
    direction: 'desc',
    visible: ['orderNumber', 'customer', 'status', 'total', 'createdAt', 'actions']
  },
  products: { 
    column: 'name', 
    direction: 'asc',
    visible: ['name', 'price', 'category', 'status', 'createdAt', 'actions']
  },
  payments: { 
    column: 'createdAt', 
    direction: 'desc',
    visible: ['paymentId', 'orderId', 'amount', 'status', 'method', 'createdAt', 'actions']
  },
}

const TableConfigContext = createContext<TableConfigContextType | undefined>(undefined)

export const useTableConfig = () => {
  const context = useContext(TableConfigContext)
  if (context === undefined) {
    throw new Error('useTableConfig must be used within a TableConfigProvider')
  }
  return context
}

interface TableConfigProviderProps {
  children: ReactNode
}

export const TableConfigProvider: React.FC<TableConfigProviderProps> = ({ children }) => {
  const [config, setConfig] = useState<TableConfig>(defaultConfig)
  const [loading, setLoading] = useState(false) // Set to false since we're not loading
  const [configLoaded, setConfigLoaded] = useState(true) // Set to true since we're using defaults

  // NO API CALLS - Use default configuration only
  // This prevents any database calls that were causing the constant API requests

  const updateTableConfig = async (tableName: keyof TableConfig, newConfig: Partial<TableSortConfig & TableColumnConfig>) => {
    // NO DATABASE CALLS - Only update local state
    // This prevents any API calls that were causing the constant requests
    try {
      const updatedConfig = {
        ...config,
        [tableName]: { ...config[tableName], ...newConfig }
      }
      setConfig(updatedConfig)
      console.log(`TableConfig: Updated ${tableName} configuration locally (no database save)`)
    } catch (error) {
      console.error('Failed to update table configuration locally:', error)
    }
  }

  const getTableConfig = (tableName: keyof TableConfig): TableSortConfig & TableColumnConfig => {
    return config[tableName] || defaultConfig[tableName]
  }

  const value: TableConfigContextType = {
    config,
    loading,
    updateTableConfig,
    getTableConfig,
  }

  return (
    <TableConfigContext.Provider value={value}>
      {children}
    </TableConfigContext.Provider>
  )
}
