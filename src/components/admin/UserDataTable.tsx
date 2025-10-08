'use client'

import React, { useState, useMemo, useEffect } from 'react'
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  flexRender,
  createColumnHelper,
  ColumnDef,
  SortingState,
  ColumnFiltersState,
  ColumnOrderState,
} from '@tanstack/react-table'
import { useTableConfig } from '@/contexts/TableConfigContext'
import { useCurrency } from '@/contexts/CurrencyContext'
import api from '@/services/api'
import {
  Users,
  UserCheck,
  UserX,
  Shield,
  MapPin,
  ShoppingBag,
  CreditCard,
  Calendar,
  Phone,
  Mail,
  Eye,
  EyeOff,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'

interface User {
  id: string
  email: string
  firstName?: string
  lastName?: string
  phoneNumber?: string
  phoneCountryCode?: string
  dateOfBirth?: string
  gender?: string
  roles: string[]
  active: boolean
  oauthOnly: boolean
  ldapEnabled?: boolean
  totpEnabled?: boolean
  createdAt: string
  updatedAt?: string
  lastLoginAt?: string
  // Newsletter and marketing preferences
  newsletterSubscribed?: boolean
  marketingEmails?: boolean
  smsNotifications?: boolean
  // Additional user information
  preferredLanguage?: string
  timezone?: string
  emailVerified?: boolean
  phoneVerified?: boolean
  profileCompleted?: boolean
  notes?: string
  // User preferences
  language?: string
  currency?: string
  preferencesCreatedAt?: string
  preferencesUpdatedAt?: string
  // Related data counts
  addressCount?: number
  orderCount?: number
  paymentCount?: number
  totalSpent?: number
}

interface UserDataTableProps {
  data: User[]
  onToggleStatus: (userId: string, currentStatus: boolean) => void
  loading?: boolean
}

const columnHelper = createColumnHelper<User>()

export function UserDataTable({ data, onToggleStatus, loading }: UserDataTableProps) {
  const { getTableConfig, updateTableConfig, loading: configLoading } = useTableConfig()
  const { formatPrice, currentCurrency } = useCurrency()
  const defaultConfig = getTableConfig('users')
  
  const [sorting, setSorting] = useState<SortingState>([
    { id: defaultConfig.column, desc: defaultConfig.direction === 'desc' }
  ])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = useState<Record<string, boolean>>({})
  const [columnOrder, setColumnOrder] = useState<ColumnOrderState>([])
  const [showColumnControls, setShowColumnControls] = useState(false)

  // Initialize column visibility from database config - ONLY ONCE
  useEffect(() => {
    if (!configLoading && defaultConfig.visible) {
      const visibility: Record<string, boolean> = {}
      
      // Set all columns to false first
      const allColumns = ['user', 'contact', 'gender', 'dateOfBirth', 'roles', 'status', 'authType', 'ldap', 'totp', 'newsletter', 'emailVerified', 'profileCompleted', 'language', 'lastLogin', 'addresses', 'orders', 'payments', 'spending', 'created', 'updated', 'actions']
      allColumns.forEach(col => {
        visibility[col] = false
      })
      
      // Set visible columns to true
      defaultConfig.visible.forEach(col => {
        visibility[col] = true
      })
      
      setColumnVisibility(visibility)
      
      // Initialize column order with default order
      const defaultOrder = ['user', 'contact', 'gender', 'dateOfBirth', 'roles', 'status', 'authType', 'ldap', 'totp', 'newsletter', 'emailVerified', 'profileCompleted', 'language', 'lastLogin', 'addresses', 'orders', 'payments', 'spending', 'created', 'updated', 'actions']
      setColumnOrder(defaultOrder)
    }
  }, []) // Empty dependency array - only run once on mount

  // Update table config when sorting changes - REMOVED to prevent infinite loops
  // The updateTableConfig function is not stable and causes infinite re-renders
  // useEffect(() => {
  //   if (sorting.length > 0) {
  //     const sort = sorting[0]
  //     updateTableConfig('users', {
  //       column: sort.id,
  //       direction: sort.desc ? 'desc' : 'asc'
  //     })
  //   }
  // }, [sorting, updateTableConfig])

  // Update table config when column visibility changes
  const handleColumnVisibilityChange = (columnId: string, isVisible: boolean, skipDatabaseUpdate = false) => {
    setColumnVisibility(prev => {
      const newVisibility = { ...prev, [columnId]: isVisible }
      
      // Update database config only if not skipping (for bulk operations)
      if (!skipDatabaseUpdate) {
        const visibleColumns = Object.keys(newVisibility).filter(key => newVisibility[key])
        updateTableConfig('users', { visible: visibleColumns })
      }
      
      return newVisibility
    })
  }

  // Function to get country flag emoji
  const getCountryFlag = (countryCode?: string) => {
    if (!countryCode) return '🌍'
    
    // Debug logging removed to prevent console spam
    
    // Handle phone country codes like +41, +1, +44, etc.
    let cleanCode = countryCode.trim()
    if (cleanCode.startsWith('+')) {
      cleanCode = cleanCode.substring(1)
    }
    
    // Map phone country codes to country codes
    const phoneToCountryCode: { [key: string]: string } = {
      '1': 'US', '7': 'RU', '20': 'EG', '27': 'ZA', '30': 'GR', '31': 'NL', '32': 'BE', '33': 'FR',
      '34': 'ES', '36': 'HU', '39': 'IT', '40': 'RO', '41': 'CH', '43': 'AT', '44': 'GB', '45': 'DK',
      '46': 'SE', '47': 'NO', '48': 'PL', '49': 'DE', '51': 'PE', '52': 'MX', '53': 'CU', '54': 'AR',
      '55': 'BR', '56': 'CL', '57': 'CO', '58': 'VE', '60': 'MY', '61': 'AU', '62': 'ID', '63': 'PH',
      '64': 'NZ', '65': 'SG', '66': 'TH', '81': 'JP', '82': 'KR', '84': 'VN', '86': 'CN', '90': 'TR',
      '91': 'IN', '92': 'PK', '93': 'AF', '94': 'LK', '95': 'MM', '98': 'IR', '212': 'MA', '213': 'DZ',
      '216': 'TN', '218': 'LY', '220': 'GM', '221': 'SN', '222': 'MR', '223': 'ML', '224': 'GN',
      '225': 'CI', '226': 'BF', '227': 'NE', '228': 'TG', '229': 'BJ', '230': 'MU', '231': 'LR',
      '232': 'SL', '233': 'GH', '234': 'NG', '235': 'TD', '236': 'CF', '237': 'CM', '238': 'CV',
      '239': 'ST', '240': 'GQ', '241': 'GA', '242': 'CG', '243': 'CD', '244': 'AO', '245': 'GW',
      '246': 'IO', '248': 'SC', '249': 'SD', '250': 'RW', '251': 'ET', '252': 'SO', '253': 'DJ',
      '254': 'KE', '255': 'TZ', '256': 'UG', '257': 'BI', '258': 'MZ', '260': 'ZM', '261': 'MG',
      '262': 'RE', '263': 'ZW', '264': 'NA', '265': 'MW', '266': 'LS', '267': 'BW', '268': 'SZ',
      '269': 'KM', '290': 'SH', '291': 'ER', '297': 'AW', '298': 'FO', '299': 'GL', '350': 'GI',
      '351': 'PT', '352': 'LU', '353': 'IE', '354': 'IS', '355': 'AL', '356': 'MT', '357': 'CY',
      '358': 'FI', '359': 'BG', '370': 'LT', '371': 'LV', '372': 'EE', '373': 'MD', '374': 'AM',
      '375': 'BY', '376': 'AD', '377': 'MC', '378': 'SM', '380': 'UA', '381': 'RS', '382': 'ME',
      '383': 'XK', '385': 'HR', '386': 'SI', '387': 'BA', '389': 'MK', '420': 'CZ', '421': 'SK',
      '423': 'LI', '500': 'FK', '501': 'BZ', '502': 'GT', '503': 'SV', '504': 'HN', '505': 'NI',
      '506': 'CR', '507': 'PA', '508': 'PM', '509': 'HT', '590': 'GP', '591': 'BO', '592': 'GY',
      '593': 'EC', '594': 'GF', '595': 'PY', '596': 'MQ', '597': 'SR', '598': 'UY', '599': 'CW',
      '670': 'TL', '672': 'NF', '673': 'BN', '674': 'NR', '675': 'PG', '676': 'TO', '677': 'SB',
      '678': 'VU', '679': 'FJ', '680': 'PW', '681': 'WF', '682': 'CK', '683': 'NU', '684': 'AS',
      '685': 'WS', '686': 'KI', '687': 'NC', '688': 'TV', '689': 'PF', '690': 'TK', '691': 'FM',
      '692': 'MH', '850': 'KP', '852': 'HK', '853': 'MO', '855': 'KH', '856': 'LA', '880': 'BD',
      '886': 'TW', '960': 'MV', '961': 'LB', '962': 'JO', '963': 'SY', '964': 'IQ', '965': 'KW',
      '966': 'SA', '967': 'YE', '968': 'OM', '970': 'PS', '971': 'AE', '972': 'IL', '973': 'BH',
      '974': 'QA', '975': 'BT', '976': 'MN', '977': 'NP', '992': 'TJ', '993': 'TM', '994': 'AZ',
      '995': 'GE', '996': 'KG', '998': 'UZ'
    }
    
    // Convert phone code to country code if needed
    const mappedCountryCode = phoneToCountryCode[cleanCode] || cleanCode
    
    // Comprehensive country code mapping
    const countryFlags: { [key: string]: string } = {
      // 2-letter codes (ISO 3166-1 alpha-2)
      'US': '🇺🇸', 'CA': '🇨🇦', 'GB': '🇬🇧', 'DE': '🇩🇪', 'FR': '🇫🇷', 'IT': '🇮🇹', 'ES': '🇪🇸',
      'AU': '🇦🇺', 'JP': '🇯🇵', 'CN': '🇨🇳', 'IN': '🇮🇳', 'BR': '🇧🇷', 'MX': '🇲🇽', 'RU': '🇷🇺',
      'NL': '🇳🇱', 'SE': '🇸🇪', 'NO': '🇳🇴', 'DK': '🇩🇰', 'FI': '🇫🇮', 'CH': '🇨🇭', 'AT': '🇦🇹',
      'BE': '🇧🇪', 'PL': '🇵🇱', 'CZ': '🇨🇿', 'HU': '🇭🇺', 'PT': '🇵🇹', 'GR': '🇬🇷', 'TR': '🇹🇷',
      'ZA': '🇿🇦', 'EG': '🇪🇬', 'NG': '🇳🇬', 'KE': '🇰🇪', 'MA': '🇲🇦', 'TN': '🇹🇳', 'DZ': '🇩🇿',
      'AR': '🇦🇷', 'CL': '🇨🇱', 'CO': '🇨🇴', 'PE': '🇵🇪', 'VE': '🇻🇪', 'UY': '🇺🇾', 'PY': '🇵🇾',
      'KR': '🇰🇷', 'TH': '🇹🇭', 'VN': '🇻🇳', 'ID': '🇮🇩', 'MY': '🇲🇾', 'SG': '🇸🇬', 'PH': '🇵🇭',
      'NZ': '🇳🇿', 'IE': '🇮🇪', 'IS': '🇮🇸', 'LU': '🇱🇺', 'MT': '🇲🇹', 'CY': '🇨🇾', 'EE': '🇪🇪',
      'LV': '🇱🇻', 'LT': '🇱🇹', 'SK': '🇸🇰', 'SI': '🇸🇮', 'HR': '🇭🇷', 'BG': '🇧🇬', 'RO': '🇷🇴',
      'UA': '🇺🇦', 'BY': '🇧🇾', 'MD': '🇲🇩', 'RS': '🇷🇸', 'BA': '🇧🇦', 'ME': '🇲🇪', 'MK': '🇲🇰',
      'AL': '🇦🇱', 'XK': '🇽🇰', 'IL': '🇮🇱', 'JO': '🇯🇴', 'LB': '🇱🇧', 'SY': '🇸🇾', 'IQ': '🇮🇶',
      'IR': '🇮🇷', 'SA': '🇸🇦', 'AE': '🇦🇪', 'QA': '🇶🇦', 'KW': '🇰🇼', 'BH': '🇧🇭', 'OM': '🇴🇲',
      'YE': '🇾🇪', 'AF': '🇦🇫', 'PK': '🇵🇰', 'BD': '🇧🇩', 'LK': '🇱🇰', 'MV': '🇲🇻', 'NP': '🇳🇵',
      'BT': '🇧🇹', 'MM': '🇲🇲', 'LA': '🇱🇦', 'KH': '🇰🇭', 'BN': '🇧🇳', 'TL': '🇹🇱', 'MN': '🇲🇳',
      'KZ': '🇰🇿', 'UZ': '🇺🇿', 'TM': '🇹🇲', 'TJ': '🇹🇯', 'KG': '🇰🇬', 'AZ': '🇦🇿', 'AM': '🇦🇲',
      'GE': '🇬🇪',
      
      // 3-letter codes (ISO 3166-1 alpha-3)
      'USA': '🇺🇸', 'CAN': '🇨🇦', 'GBR': '🇬🇧', 'DEU': '🇩🇪', 'FRA': '🇫🇷', 'ITA': '🇮🇹', 'ESP': '🇪🇸',
      'AUS': '🇦🇺', 'JPN': '🇯🇵', 'CHN': '🇨🇳', 'IND': '🇮🇳', 'BRA': '🇧🇷', 'MEX': '🇲🇽', 'RUS': '🇷🇺',
      'NLD': '🇳🇱', 'SWE': '🇸🇪', 'NOR': '🇳🇴', 'DNK': '🇩🇰', 'FIN': '🇫🇮', 'CHE': '🇨🇭', 'AUT': '🇦🇹',
      'BEL': '🇧🇪', 'POL': '🇵🇱', 'CZE': '🇨🇿', 'HUN': '🇭🇺', 'PRT': '🇵🇹', 'GRC': '🇬🇷', 'TUR': '🇹🇷',
      'ZAF': '🇿🇦', 'EGY': '🇪🇬', 'NGA': '🇳🇬', 'KEN': '🇰🇪', 'MAR': '🇲🇦', 'TUN': '🇹🇳', 'DZA': '🇩🇿',
      'ARG': '🇦🇷', 'CHL': '🇨🇱', 'COL': '🇨🇴', 'PER': '🇵🇪', 'VEN': '🇻🇪', 'URY': '🇺🇾', 'PRY': '🇵🇾',
      'KOR': '🇰🇷', 'THA': '🇹🇭', 'VNM': '🇻🇳', 'IDN': '🇮🇩', 'MYS': '🇲🇾', 'SGP': '🇸🇬', 'PHL': '🇵🇭',
      'NZL': '🇳🇿', 'IRL': '🇮🇪', 'ISL': '🇮🇸', 'LUX': '🇱🇺', 'MLT': '🇲🇹', 'CYP': '🇨🇾', 'EST': '🇪🇪',
      'LVA': '🇱🇻', 'LTU': '🇱🇹', 'SVK': '🇸🇰', 'SVN': '🇸🇮', 'HRV': '🇭🇷', 'BGR': '🇧🇬', 'ROU': '🇷🇴',
      'UKR': '🇺🇦', 'BLR': '🇧🇾', 'MDA': '🇲🇩', 'SRB': '🇷🇸', 'BIH': '🇧🇦', 'MNE': '🇲🇪', 'MKD': '🇲🇰',
      'ALB': '🇦🇱', 'XKX': '🇽🇰', 'ISR': '🇮🇱', 'JOR': '🇯🇴', 'LBN': '🇱🇧', 'SYR': '🇸🇾', 'IRQ': '🇮🇶',
      'IRN': '🇮🇷', 'SAU': '🇸🇦', 'ARE': '🇦🇪', 'QAT': '🇶🇦', 'KWT': '🇰🇼', 'BHR': '🇧🇭', 'OMN': '🇴🇲',
      'YEM': '🇾🇪', 'AFG': '🇦🇫', 'PAK': '🇵🇰', 'BGD': '🇧🇩', 'LKA': '🇱🇰', 'MDV': '🇲🇻', 'NPL': '🇳🇵',
      'BTN': '🇧🇹', 'MMR': '🇲🇲', 'LAO': '🇱🇦', 'KHM': '🇰🇭', 'BRN': '🇧🇳', 'TLS': '🇹🇱', 'MNG': '🇲🇳',
      'KAZ': '🇰🇿', 'UZB': '🇺🇿', 'TKM': '🇹🇲', 'TJK': '🇹🇯', 'KGZ': '🇰🇬', 'AZE': '🇦🇿', 'ARM': '🇦🇲',
      'GEO': '🇬🇪',
      
      // Full country names
      'UNITED STATES': '🇺🇸', 'CANADA': '🇨🇦', 'UNITED KINGDOM': '🇬🇧', 'GERMANY': '🇩🇪', 'FRANCE': '🇫🇷',
      'ITALY': '🇮🇹', 'SPAIN': '🇪🇸', 'AUSTRALIA': '🇦🇺', 'JAPAN': '🇯🇵', 'CHINA': '🇨🇳', 'INDIA': '🇮🇳',
      'BRAZIL': '🇧🇷', 'MEXICO': '🇲🇽', 'RUSSIA': '🇷🇺', 'NETHERLANDS': '🇳🇱', 'SWEDEN': '🇸🇪',
      'NORWAY': '🇳🇴', 'DENMARK': '🇩🇰', 'FINLAND': '🇫🇮', 'SWITZERLAND': '🇨🇭', 'AUSTRIA': '🇦🇹',
      'BELGIUM': '🇧🇪', 'POLAND': '🇵🇱', 'CZECH REPUBLIC': '🇨🇿', 'HUNGARY': '🇭🇺', 'PORTUGAL': '🇵🇹',
      'GREECE': '🇬🇷', 'TURKEY': '🇹🇷', 'SOUTH AFRICA': '🇿🇦', 'EGYPT': '🇪🇬', 'NIGERIA': '🇳🇬',
      'KENYA': '🇰🇪', 'MOROCCO': '🇲🇦', 'TUNISIA': '🇹🇳', 'ALGERIA': '🇩🇿', 'ARGENTINA': '🇦🇷',
      'CHILE': '🇨🇱', 'COLOMBIA': '🇨🇴', 'PERU': '🇵🇪', 'VENEZUELA': '🇻🇪', 'URUGUAY': '🇺🇾',
      'PARAGUAY': '🇵🇾', 'SOUTH KOREA': '🇰🇷', 'THAILAND': '🇹🇭', 'VIETNAM': '🇻🇳', 'INDONESIA': '🇮🇩',
      'MALAYSIA': '🇲🇾', 'SINGAPORE': '🇸🇬', 'PHILIPPINES': '🇵🇭', 'NEW ZEALAND': '🇳🇿',
      'IRELAND': '🇮🇪', 'ICELAND': '🇮🇸', 'LUXEMBOURG': '🇱🇺', 'MALTA': '🇲🇹', 'CYPRUS': '🇨🇾',
      'ESTONIA': '🇪🇪', 'LATVIA': '🇱🇻', 'LITHUANIA': '🇱🇹', 'SLOVAKIA': '🇸🇰', 'SLOVENIA': '🇸🇮',
      'CROATIA': '🇭🇷', 'BULGARIA': '🇧🇬', 'ROMANIA': '🇷🇴', 'UKRAINE': '🇺🇦', 'BELARUS': '🇧🇾',
      'MOLDOVA': '🇲🇩', 'SERBIA': '🇷🇸', 'BOSNIA AND HERZEGOVINA': '🇧🇦', 'MONTENEGRO': '🇲🇪',
      'NORTH MACEDONIA': '🇲🇰', 'ALBANIA': '🇦🇱', 'KOSOVO': '🇽🇰', 'ISRAEL': '🇮🇱', 'JORDAN': '🇯🇴',
      'LEBANON': '🇱🇧', 'SYRIA': '🇸🇾', 'IRAQ': '🇮🇶', 'IRAN': '🇮🇷', 'SAUDI ARABIA': '🇸🇦',
      'UNITED ARAB EMIRATES': '🇦🇪', 'QATAR': '🇶🇦', 'KUWAIT': '🇰🇼', 'BAHRAIN': '🇧🇭', 'OMAN': '🇴🇲',
      'YEMEN': '🇾🇪', 'AFGHANISTAN': '🇦🇫', 'PAKISTAN': '🇵🇰', 'BANGLADESH': '🇧🇩', 'SRI LANKA': '🇱🇰',
      'MALDIVES': '🇲🇻', 'NEPAL': '🇳🇵', 'BHUTAN': '🇧🇹', 'MYANMAR': '🇲🇲', 'LAOS': '🇱🇦',
      'CAMBODIA': '🇰🇭', 'BRUNEI': '🇧🇳', 'EAST TIMOR': '🇹🇱', 'MONGOLIA': '🇲🇳', 'KAZAKHSTAN': '🇰🇿',
      'UZBEKISTAN': '🇺🇿', 'TURKMENISTAN': '🇹🇲', 'TAJIKISTAN': '🇹🇯', 'KYRGYZSTAN': '🇰🇬',
      'AZERBAIJAN': '🇦🇿', 'ARMENIA': '🇦🇲', 'GEORGIA': '🇬🇪'
    }
    
    const upperCode = mappedCountryCode.toUpperCase().trim()
    const flag = countryFlags[upperCode]
    
    if (flag) {
      return flag
    } else {
      return '🌍'
    }
  }

  const columns = useMemo(
    () => [
      // User Info Column
      columnHelper.accessor('email', {
        id: 'user',
        header: 'User',
        cell: ({ row }) => {
          const user = row.original
          return (
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0 h-10 w-10">
                <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center">
                  <Users className="h-5 w-5 text-primary-600" />
                </div>
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-medium text-gray-900 truncate">
                  {user.firstName && user.lastName 
                    ? `${user.firstName} ${user.lastName}`
                    : 'No Name'
                  }
                </div>
                <div className="text-sm text-gray-500 truncate">{user.email}</div>
              </div>
            </div>
          )
        },
      }),

      // Contact Column
      columnHelper.accessor('phoneNumber', {
        id: 'contact',
        header: 'Contact',
        cell: ({ row }) => {
          const user = row.original
          return (
            <div className="text-sm">
              {user.phoneNumber ? (
                <div className="flex items-center space-x-1">
                  <span className="text-lg">
                    {getCountryFlag(user.phoneCountryCode)}
                  </span>
                  <span>{user.phoneCountryCode} {user.phoneNumber}</span>
                </div>
              ) : (
                <span className="text-gray-400">No phone</span>
              )}
            </div>
          )
        },
      }),

      // Roles Column
      columnHelper.accessor('roles', {
        id: 'roles',
        header: 'Roles',
        sortingFn: (rowA, rowB) => {
          const rolesA = rowA.original.roles
          const rolesB = rowB.original.roles
          
          // Get the first role name for comparison
          const roleA = rolesA.length > 0 ? (typeof rolesA[0] === 'string' ? rolesA[0] : (rolesA[0] as any)?.name || (rolesA[0] as any)?.id) : ''
          const roleB = rolesB.length > 0 ? (typeof rolesB[0] === 'string' ? rolesB[0] : (rolesB[0] as any)?.name || (rolesB[0] as any)?.id) : ''
          
          return roleA.localeCompare(roleB)
        },
        cell: ({ row }) => {
          const roles = row.original.roles
          return (
            <div className="flex flex-wrap gap-1">
              {roles.map((role) => {
                const roleName = typeof role === 'string' ? role : (role as any)?.name || (role as any)?.id
                return (
                  <span
                    key={roleName}
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      roleName === 'ADMIN' 
                        ? 'bg-red-100 text-red-800' 
                        : 'bg-blue-100 text-blue-800'
                    }`}
                  >
                    {roleName}
                  </span>
                )
              })}
            </div>
          )
        },
      }),

      // Status Column
      columnHelper.accessor('active', {
        id: 'status',
        header: 'Status',
        cell: ({ row }) => {
          const isActive = row.original.active
          return (
            <span
              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                isActive
                  ? 'bg-green-100 text-green-800'
                  : 'bg-red-100 text-red-800'
              }`}
            >
              {isActive ? 'Active' : 'Inactive'}
            </span>
          )
        },
      }),

      // Auth Type Column
      columnHelper.accessor('oauthOnly', {
        id: 'authType',
        header: 'Auth Type',
        cell: ({ row }) => {
          const isOAuth = row.original.oauthOnly
          return (
            <span className="text-sm text-gray-900">
              {isOAuth ? 'OAuth Only' : 'Email/Password'}
            </span>
          )
        },
      }),

      // Gender Column
      columnHelper.accessor('gender', {
        id: 'gender',
        header: 'Gender',
        cell: ({ row }) => {
          const gender = row.original.gender
          return (
            <span className="text-sm text-gray-900">
              {gender || 'Not specified'}
            </span>
          )
        },
      }),

      // Date of Birth Column
      columnHelper.accessor('dateOfBirth', {
        id: 'dateOfBirth',
        header: 'Date of Birth',
        cell: ({ row }) => {
          const dob = row.original.dateOfBirth
          if (!dob) return <span className="text-sm text-gray-400">Not provided</span>
          
          try {
            // Handle different date formats
            let date: Date
            if (dob.includes('T') || dob.includes('+')) {
              // ISO format: 2025-10-06T22:01:18.132+02:00
              date = new Date(dob)
            } else if (dob.includes('-')) {
              // Date format: 2025-10-06
              const [year, month, day] = dob.split('-').map(Number)
              date = new Date(year, month - 1, day)
            } else {
              date = new Date(dob)
            }
            
            // Check if date is valid (not 1970)
            if (isNaN(date.getTime()) || date.getFullYear() < 2000) {
              return <span className="text-sm text-gray-400">Invalid date</span>
            }
            
            // Format as dd.mm.yyyy
            const day = date.getDate().toString().padStart(2, '0')
            const month = (date.getMonth() + 1).toString().padStart(2, '0')
            const year = date.getFullYear()
            
            return <span className="text-sm text-gray-900">{day}.{month}.{year}</span>
          } catch {
            return <span className="text-sm text-gray-400">Invalid date</span>
          }
        },
      }),

      // LDAP Column
      columnHelper.accessor('ldapEnabled', {
        id: 'ldap',
        header: 'LDAP',
        cell: ({ row }) => {
          const ldapEnabled = row.original.ldapEnabled
          return (
            <div className="flex items-center space-x-1">
              <Shield className={`w-4 h-4 ${ldapEnabled ? 'text-green-600' : 'text-gray-400'}`} />
              <span className={`text-sm ${ldapEnabled ? 'text-green-600' : 'text-gray-500'}`}>
                {ldapEnabled ? 'Enabled' : 'Disabled'}
              </span>
            </div>
          )
        },
      }),

      // 2FA Column
      columnHelper.accessor('totpEnabled', {
        id: 'totp',
        header: '2FA',
        cell: ({ row }) => {
          const totpEnabled = row.original.totpEnabled
          return (
            <div className="flex items-center space-x-1">
              <Shield className={`w-4 h-4 ${totpEnabled ? 'text-green-600' : 'text-gray-400'}`} />
              <span className={`text-sm ${totpEnabled ? 'text-green-600' : 'text-gray-500'}`}>
                {totpEnabled ? 'Enabled' : 'Disabled'}
              </span>
            </div>
          )
        },
      }),

      // Newsletter Column
      columnHelper.accessor('newsletterSubscribed', {
        id: 'newsletter',
        header: 'Newsletter',
        cell: ({ row }) => {
          const subscribed = row.original.newsletterSubscribed
          return (
            <div className="flex items-center space-x-1">
              <span className={`w-2 h-2 rounded-full ${subscribed ? 'bg-green-500' : 'bg-gray-300'}`}></span>
              <span className={`text-sm ${subscribed ? 'text-green-600' : 'text-gray-500'}`}>
                {subscribed ? 'Subscribed' : 'Not subscribed'}
              </span>
            </div>
          )
        },
      }),

      // Email Verified Column
      columnHelper.accessor('emailVerified', {
        id: 'emailVerified',
        header: 'Email Verified',
        cell: ({ row }) => {
          const verified = row.original.emailVerified
          const userId = row.original.id
          
          const handleSendActivationEmail = async () => {
            try {
              console.log(`Sending activation email to user ${userId}`)
              const response = await api.post(`/api/admin/users/${userId}/send-activation-email`)
              
              if (response.data.success) {
                alert(`Activation email sent successfully to ${response.data.email}`)
              } else {
                alert(`Failed to send activation email: ${response.data.message}`)
              }
            } catch (error) {
              console.error('Failed to send activation email:', error)
              alert('Failed to send activation email. Please try again.')
            }
          }
          
          return (
            <div className="flex items-center space-x-2">
              <div className="flex items-center space-x-1">
                <span className={`w-2 h-2 rounded-full ${verified ? 'bg-green-500' : 'bg-red-500'}`}></span>
                <span className={`text-sm ${verified ? 'text-green-600' : 'text-red-600'}`}>
                  {verified ? 'Verified' : 'Unverified'}
                </span>
              </div>
              {!verified && (
                <button
                  onClick={handleSendActivationEmail}
                  className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
                  title="Send activation email"
                >
                  Send Email
                </button>
              )}
            </div>
          )
        },
      }),

      // Profile Completed Column
      columnHelper.accessor('profileCompleted', {
        id: 'profileCompleted',
        header: 'Profile',
        cell: ({ row }) => {
          const completed = row.original.profileCompleted
          return (
            <div className="flex items-center space-x-1">
              <span className={`w-2 h-2 rounded-full ${completed ? 'bg-green-500' : 'bg-yellow-500'}`}></span>
              <span className={`text-sm ${completed ? 'text-green-600' : 'text-yellow-600'}`}>
                {completed ? 'Complete' : 'Incomplete'}
              </span>
            </div>
          )
        },
      }),

      // Language Column (from preferences)
      columnHelper.accessor('language', {
        id: 'language',
        header: 'Language',
        cell: ({ row }) => {
          const language = row.original.language || 'English'
          const languageNames: { [key: string]: string } = {
            'en': 'English',
            'en-US': 'English',
            'de': 'Deutsch',
            'de-DE': 'Deutsch',
            'fr': 'Français',
            'fr-FR': 'Français',
            'es': 'Español',
            'es-ES': 'Español',
            'it': 'Italiano',
            'it-IT': 'Italiano'
          }
          return (
            <span className="text-sm text-gray-900">
              {languageNames[language] || language}
            </span>
          )
        },
      }),

      // Currency Column (from preferences)
      columnHelper.accessor('currency', {
        id: 'currency',
        header: 'Currency',
        cell: ({ row }) => {
          const currency = row.original.currency || 'CHF'
          return (
            <span className="text-sm text-gray-900">
              {currency}
            </span>
          )
        },
      }),

      // Last Login Column
      columnHelper.accessor('lastLoginAt', {
        id: 'lastLogin',
        header: 'Last Login',
        cell: ({ row }) => {
          const lastLogin = row.original.lastLoginAt
          if (!lastLogin) return <span className="text-sm text-gray-400">Never</span>
          
          try {
            const date = new Date(lastLogin)
            const now = new Date()
            const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))
            
            let timeAgo: string
            if (diffInHours < 1) {
              timeAgo = 'Just now'
            } else if (diffInHours < 24) {
              timeAgo = `${diffInHours}h ago`
            } else if (diffInHours < 168) { // 7 days
              timeAgo = `${Math.floor(diffInHours / 24)}d ago`
            } else {
              timeAgo = date.toLocaleDateString()
            }
            
            return (
              <span className="text-sm text-gray-600" title={date.toLocaleString()}>
                {timeAgo}
              </span>
            )
          } catch {
            return <span className="text-sm text-gray-400">Invalid date</span>
          }
        },
      }),

      // Addresses Column
      columnHelper.accessor('addressCount', {
        id: 'addresses',
        header: 'Addresses',
        cell: ({ row }) => {
          const count = row.original.addressCount || 0
          return (
            <div className="flex items-center space-x-1">
              <MapPin className="w-4 h-4 text-gray-400" />
              <span className="text-sm text-gray-900">{count}</span>
            </div>
          )
        },
      }),

      // Orders Column
      columnHelper.accessor('orderCount', {
        id: 'orders',
        header: 'Orders',
        cell: ({ row }) => {
          const count = row.original.orderCount || 0
          return (
            <div className="flex items-center space-x-1">
              <ShoppingBag className="w-4 h-4 text-gray-400" />
              <span className="text-sm text-gray-900">{count}</span>
            </div>
          )
        },
      }),

      // Payments Column
      columnHelper.accessor('paymentCount', {
        id: 'payments',
        header: 'Payments',
        cell: ({ row }) => {
          const count = row.original.paymentCount || 0
          return (
            <div className="flex items-center space-x-1">
              <CreditCard className="w-4 h-4 text-gray-400" />
              <span className="text-sm text-gray-900">{count}</span>
            </div>
          )
        },
      }),

      // Total Spent Column
      columnHelper.accessor('totalSpent', {
        id: 'spending',
        header: 'Total Spent',
        cell: ({ row }) => {
          const total = row.original.totalSpent || 0
          return (
            <span className="text-sm text-gray-900">
              {formatPrice(total, currentCurrency)}
            </span>
          )
        },
      }),

      // Created Date Column (from preferences)
      columnHelper.accessor('preferencesCreatedAt', {
        id: 'created',
        header: 'Created',
        cell: ({ row }) => {
          const date = row.original.preferencesCreatedAt || row.original.createdAt
          try {
            // Handle different date formats
            let dateObj: Date
            
            if (date.includes(' ') && date.includes('+')) {
              // Handle format: "2025-10-08 20:05:53.680 +0200"
              // Convert to: "2025-10-08T20:05:53.680+02:00"
              let normalizedDate = date
              
              // Replace space with T: "2025-10-08 20:05:53.680 +0200" -> "2025-10-08T20:05:53.680 +0200"
              normalizedDate = normalizedDate.replace(/(\d{4}-\d{2}-\d{2})\s+(\d{2}:\d{2}:\d{2})/, '$1T$2')
              
              // Fix timezone format: "+0200" -> "+02:00"
              normalizedDate = normalizedDate.replace(/([+-])(\d{2})(\d{2})$/, '$1$2:$3')
              
              dateObj = new Date(normalizedDate)
            } else if (date.includes('T') || date.includes('+')) {
              // ISO format: 2025-10-06T22:01:18.132+02:00
              dateObj = new Date(date)
            } else if (date.includes('-')) {
              // Date format: 2025-10-06
              const [year, month, day] = date.split('-').map(Number)
              dateObj = new Date(year, month - 1, day)
            } else {
              dateObj = new Date(date)
            }
            
            // Check if date is valid (not 1970)
            if (isNaN(dateObj.getTime()) || dateObj.getFullYear() < 2000) {
              return <span className="text-sm text-gray-400">Invalid date</span>
            }
            
            // Format as dd.mm.yyyy + HH:MM:SS
            const day = dateObj.getDate().toString().padStart(2, '0')
            const month = (dateObj.getMonth() + 1).toString().padStart(2, '0')
            const year = dateObj.getFullYear()
            const hours = dateObj.getHours().toString().padStart(2, '0')
            const minutes = dateObj.getMinutes().toString().padStart(2, '0')
            const seconds = dateObj.getSeconds().toString().padStart(2, '0')
            
            return (
              <span className="text-sm text-gray-500">
                {day}.{month}.{year} + {hours}:{minutes}:{seconds}
              </span>
            )
          } catch {
            return <span className="text-sm text-gray-400">Invalid date</span>
          }
        },
      }),

      // Actions Column
      columnHelper.display({
        id: 'actions',
        header: 'Actions',
        cell: ({ row }) => {
          const user = row.original
          return (
            <button
              onClick={() => onToggleStatus(user.id, user.active)}
              className={`${
                user.active
                  ? 'text-red-600 hover:text-red-900'
                  : 'text-green-600 hover:text-green-900'
              }`}
            >
              {user.active ? (
                <>
                  <UserX className="w-4 h-4 inline mr-1" />
                  Deactivate
                </>
              ) : (
                <>
                  <UserCheck className="w-4 h-4 inline mr-1" />
                  Activate
                </>
              )}
            </button>
          )
        },
      }),
    ],
    [onToggleStatus]
  )

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      columnOrder,
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onColumnOrderChange: setColumnOrder,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
  })


  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-primary-500"></div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Column Visibility Dropdown */}
      <div className="bg-white rounded-lg shadow mb-4 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <select
                value=""
                onChange={(e) => {
                  if (e.target.value) {
                    const column = table.getColumn(e.target.value)
                    if (column) {
                      handleColumnVisibilityChange(column.id, !column.getIsVisible())
                    }
                  }
                }}
                className="appearance-none bg-white border border-gray-300 rounded-md px-3 py-2 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="">Toggle Column...</option>
                {table.getAllColumns()
                  .filter(column => column.getCanHide())
                  .map(column => (
                    <option key={column.id} value={column.id}>
                      {column.getIsVisible() ? '✓ ' : '○ '}{column.id.replace(/([A-Z])/g, ' $1').trim()}
                    </option>
                  ))}
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                <ChevronDown className="h-4 w-4 text-gray-400" />
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <button
                onClick={() => {
                  const allColumns = table.getAllColumns().filter(column => column.getCanHide())
                  const visibleColumns = allColumns.map(col => col.id)
                  
                  // Set all columns to visible
                  setColumnVisibility(prev => {
                    const newVisibility = { ...prev }
                    allColumns.forEach(column => {
                      newVisibility[column.id] = true
                    })
                    return newVisibility
                  })
                  
                  // Update database config
                  updateTableConfig('users', { visible: visibleColumns })
                }}
                className="text-xs text-primary-600 hover:text-primary-800 px-3 py-1 rounded-md border border-primary-200 hover:bg-primary-50"
              >
                Show All
              </button>
              <button
                onClick={() => {
                  const allColumns = table.getAllColumns().filter(column => column.getCanHide())
                  
                  // Set all columns to hidden
                  setColumnVisibility(prev => {
                    const newVisibility = { ...prev }
                    allColumns.forEach(column => {
                      newVisibility[column.id] = false
                    })
                    return newVisibility
                  })
                  
                  // Update database config
                  updateTableConfig('users', { visible: [] })
                }}
                className="text-xs text-gray-600 hover:text-gray-800 px-3 py-1 rounded-md border border-gray-200 hover:bg-gray-50"
              >
                Hide All
              </button>
            </div>
          </div>
          
          <div className="text-xs text-gray-500">
            {table.getAllColumns().filter(column => column.getIsVisible()).length} of {table.getAllColumns().length} columns visible
          </div>
        </div>
      </div>

      {/* Sorting Controls */}
      <div className="bg-white rounded-lg shadow mb-4 p-4">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <label className="text-sm font-medium text-gray-700">Sort by:</label>
            <select
              value={sorting.length > 0 ? sorting[0].id : 'created'}
              onChange={(e) => {
                const newSorting = e.target.value ? [{ id: e.target.value, desc: sorting.length > 0 ? sorting[0].desc : false }] : []
                setSorting(newSorting)
              }}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="created">Created Date</option>
              <option value="email">Email</option>
              <option value="firstName">First Name</option>
              <option value="lastName">Last Name</option>
              <option value="active">Status</option>
              <option value="roles">Role</option>
              <option value="language">Language</option>
              <option value="currency">Currency</option>
              <option value="lastLoginAt">Last Login</option>
            </select>
          </div>
          
          <div className="flex items-center space-x-2">
            <label className="text-sm font-medium text-gray-700">Direction:</label>
            <select
              value={sorting.length > 0 ? (sorting[0].desc ? 'desc' : 'asc') : 'desc'}
              onChange={(e) => {
                if (sorting.length > 0) {
                  const newSorting = [{ id: sorting[0].id, desc: e.target.value === 'desc' }]
                  setSorting(newSorting)
                }
              }}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="desc">Descending</option>
              <option value="asc">Ascending</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              {table.getHeaderGroups().map(headerGroup => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map(header => (
                    <th
                      key={header.id}
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      onClick={header.column.getToggleSortingHandler()}
                      draggable={true}
                      onDragStart={(e) => {
                        e.dataTransfer.setData('text/plain', header.id)
                      }}
                      onDragOver={(e) => {
                        e.preventDefault()
                      }}
                      onDrop={(e) => {
                        e.preventDefault()
                        const draggedColumnId = e.dataTransfer.getData('text/plain')
                        if (draggedColumnId && draggedColumnId !== header.id) {
                          let currentOrder = table.getState().columnOrder
                          
                          // If columnOrder is empty, get all column IDs from the table
                          if (currentOrder.length === 0) {
                            currentOrder = table.getAllColumns().map(col => col.id)
                          }
                          
                          const draggedIndex = currentOrder.indexOf(draggedColumnId)
                          const targetIndex = currentOrder.indexOf(header.id)
                          
                          if (draggedIndex !== -1 && targetIndex !== -1) {
                            const newOrder = [...currentOrder]
                            newOrder.splice(draggedIndex, 1)
                            newOrder.splice(targetIndex, 0, draggedColumnId)
                            setColumnOrder(newOrder)
                          }
                        }
                      }}
                    >
                      <div className="flex items-center space-x-1">
                        <span>
                          {header.isPlaceholder
                            ? null
                            : flexRender(header.column.columnDef.header, header.getContext())}
                        </span>
                        {header.column.getCanSort() && (
                          <div className="flex flex-col">
                            {header.column.getIsSorted() === 'asc' ? (
                              <ChevronUp className="w-3 h-3" />
                            ) : header.column.getIsSorted() === 'desc' ? (
                              <ChevronDown className="w-3 h-3" />
                            ) : (
                              <div className="w-3 h-3" />
                            )}
                          </div>
                        )}
                        <div className="w-1 h-4 bg-gray-300 rounded cursor-move ml-1"></div>
                      </div>
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {table.getRowModel().rows.map(row => (
                <tr key={row.id} className="hover:bg-gray-50">
                  {row.getVisibleCells().map(cell => (
                    <td key={cell.id} className="px-6 py-4 whitespace-nowrap">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
          <div className="flex-1 flex justify-between sm:hidden">
            <button
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
              className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <button
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
              className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700">
                Showing{' '}
                <span className="font-medium">
                  {table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1}
                </span>
                {' '}to{' '}
                <span className="font-medium">
                  {Math.min(
                    (table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize,
                    table.getFilteredRowModel().rows.length
                  )}
                </span>
                {' '}of{' '}
                <span className="font-medium">{table.getFilteredRowModel().rows.length}</span>
                {' '}results
              </p>
            </div>
            <div>
              <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                <button
                  onClick={() => table.previousPage()}
                  disabled={!table.getCanPreviousPage()}
                  className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                
                {Array.from({ length: Math.min(5, table.getPageCount()) }, (_, i) => {
                  const page = i + 1
                  return (
                    <button
                      key={page}
                      onClick={() => table.setPageIndex(page - 1)}
                      className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                        table.getState().pagination.pageIndex === page - 1
                          ? 'z-10 bg-primary-50 border-primary-500 text-primary-600'
                          : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                      }`}
                    >
                      {page}
                    </button>
                  )
                })}
                
                <button
                  onClick={() => table.nextPage()}
                  disabled={!table.getCanNextPage()}
                  className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </nav>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
