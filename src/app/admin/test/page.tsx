'use client'

import { useState } from 'react'
import { AdminLayout } from '@/components/admin/AdminLayout'
import { TestTube2, CheckCircle2, XCircle, AlertCircle, Loader2 } from 'lucide-react'
import api from '@/services/api'

interface TestResult {
  success: boolean
  message: string
  createdProducts?: string[]
  errors?: string[]
  configured?: boolean
  hasPublishableKey?: boolean
  publishableKeyPreview?: string
  status?: 'success' | 'warning' | 'error'
  deletedDatabaseRecords?: number
  deletedS3Files?: number
  breakdown?: Record<string, number>
  s3Error?: string
  modeLabel?: string
  testPaymentIntentId?: string
  testPaymentIntentStatus?: string
  testAmount?: number
  testCurrency?: string
  dashboardUrl?: string
  warning?: string
}

export default function AdminTestPage() {
  const [generatingProducts, setGeneratingProducts] = useState(false)
  const [testingStripe, setTestingStripe] = useState(false)
  const [testingStripeProd, setTestingStripeProd] = useState(false)
  const [deletingEverything, setDeletingEverything] = useState(false)
  const [productResult, setProductResult] = useState<TestResult | null>(null)
  const [stripeResult, setStripeResult] = useState<TestResult | null>(null)
  const [stripeProdResult, setStripeProdResult] = useState<TestResult | null>(null)
  const [deleteResult, setDeleteResult] = useState<TestResult | null>(null)
  const [confirmDialogs, setConfirmDialogs] = useState({
    products: false,
    stripe: false,
    stripeProd: false,
    deleteEverything: false,
    deleteEverythingSecond: false
  })

  const handleGenerateProducts = async () => {
    if (!confirmDialogs.products) {
      setConfirmDialogs({ ...confirmDialogs, products: true })
      return
    }

    try {
      setGeneratingProducts(true)
      const response = await api.post('/api/admin/test/generate-products')
      setProductResult(response.data)
    } catch (error: any) {
      setProductResult({
        success: false,
        message: error.response?.data?.error || 'Failed to generate products',
        errors: [error.message]
      })
    } finally {
      setGeneratingProducts(false)
      setConfirmDialogs({ ...confirmDialogs, products: false })
    }
  }

  const handleTestStripe = async () => {
    if (!confirmDialogs.stripe) {
      setConfirmDialogs({ ...confirmDialogs, stripe: true })
      return
    }

    try {
      setTestingStripe(true)
      const response = await api.post('/api/admin/test/test-stripe')
      setStripeResult(response.data)
    } catch (error: any) {
      setStripeResult({
        success: false,
        message: error.response?.data?.error || 'Failed to test Stripe connection',
        status: 'error'
      })
    } finally {
      setTestingStripe(false)
      setConfirmDialogs({ ...confirmDialogs, stripe: false })
    }
  }

  const handleTestStripeProd = async () => {
    if (!confirmDialogs.stripeProd) {
      setConfirmDialogs({ ...confirmDialogs, stripeProd: true })
      return
    }

    try {
      setTestingStripeProd(true)
      const response = await api.post('/api/admin/test/test-stripe-prod')
      setStripeProdResult(response.data)
    } catch (error: any) {
      setStripeProdResult({
        success: false,
        message: error.response?.data?.error || 'Failed to test Stripe PROD connection',
        status: 'error'
      })
    } finally {
      setTestingStripeProd(false)
      setConfirmDialogs({ ...confirmDialogs, stripeProd: false })
    }
  }

  const handleDeleteEverything = async () => {
    if (!confirmDialogs.deleteEverything) {
      setConfirmDialogs({ ...confirmDialogs, deleteEverything: true, deleteEverythingSecond: false })
      return
    }
    
    if (!confirmDialogs.deleteEverythingSecond) {
      setConfirmDialogs({ ...confirmDialogs, deleteEverythingSecond: true })
      return
    }

    try {
      setDeletingEverything(true)
      const response = await api.post('/api/admin/test/delete-everything')
      setDeleteResult(response.data)
      // Clear other results when deleting
      setProductResult(null)
      setStripeResult(null)
    } catch (error: any) {
      setDeleteResult({
        success: false,
        message: error.response?.data?.error || 'Failed to delete all data',
        status: 'error'
      })
    } finally {
      setDeletingEverything(false)
      setConfirmDialogs({ ...confirmDialogs, deleteEverything: false, deleteEverythingSecond: false })
    }
  }

  const getStatusIcon = (status?: string, success?: boolean) => {
    if (status === 'success' || success) {
      return <CheckCircle2 className="w-5 h-5 text-green-500" />
    } else if (status === 'warning') {
      return <AlertCircle className="w-5 h-5 text-yellow-500" />
    } else {
      return <XCircle className="w-5 h-5 text-red-500" />
    }
  }

  const getStatusColor = (status?: string, success?: boolean) => {
    if (status === 'success' || success) {
      return 'border-green-500 bg-green-50'
    } else if (status === 'warning') {
      return 'border-yellow-500 bg-yellow-50'
    } else {
      return 'border-red-500 bg-red-50'
    }
  }

  return (
    <AdminLayout>
      <div className="container mx-auto p-6">
        <div className="flex items-center space-x-3 mb-6">
          <TestTube2 className="w-8 h-8 text-primary-600" />
          <h1 className="text-3xl font-bold text-gray-900">Test Utilities</h1>
        </div>

        <p className="text-gray-600 mb-8">
          Use these utilities to test system functionality. All actions require confirmation.
        </p>

        <div className="space-y-6">
          {/* Generate Test Products */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Generate Test Products</h2>
                <p className="text-sm text-gray-600 mt-1">
                  Creates 2-3 test products from JSON files in test-products directory
                </p>
              </div>
            </div>

            {confirmDialogs.products ? (
              <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-yellow-800 font-medium mb-3">
                  Are you sure you want to generate test products? This will create new products in the database.
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={handleGenerateProducts}
                    disabled={generatingProducts}
                    className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 disabled:opacity-50 flex items-center gap-2"
                  >
                    {generatingProducts ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      'Yes, Generate Products'
                    )}
                  </button>
                  <button
                    onClick={() => setConfirmDialogs({ ...confirmDialogs, products: false })}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setConfirmDialogs({ ...confirmDialogs, products: true })}
                disabled={generatingProducts}
                className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
              >
                Generate Test Products
              </button>
            )}

            {productResult && (
              <div className={`mt-4 p-4 border-2 rounded-lg ${getStatusColor(productResult.status, productResult.success)}`}>
                <div className="flex items-start gap-3">
                  {getStatusIcon(productResult.status, productResult.success)}
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{productResult.message}</p>
                    
                    {productResult.createdProducts && productResult.createdProducts.length > 0 && (
                      <div className="mt-2">
                        <p className="text-sm font-medium text-gray-700 mb-1">Created Products:</p>
                        <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                          {productResult.createdProducts.map((product, idx) => (
                            <li key={idx}>{product}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {productResult.errors && productResult.errors.length > 0 && (
                      <div className="mt-2">
                        <p className="text-sm font-medium text-red-700 mb-1">Errors:</p>
                        <ul className="list-disc list-inside text-sm text-red-600 space-y-1">
                          {productResult.errors.map((error, idx) => (
                            <li key={idx}>{error}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Test Stripe Connection (TEST/SANDBOX) */}
          <div className="bg-white rounded-lg shadow p-6 border-2 border-blue-200">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  Test Stripe Connection <span className="text-sm font-normal text-blue-700">(SANDBOX/TEST)</span>
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  Tests Stripe TEST/SANDBOX mode connection by creating a test PaymentIntent
                </p>
              </div>
            </div>

            {confirmDialogs.stripe ? (
              <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-yellow-800 font-medium mb-3">
                  Are you sure you want to test the Stripe connection? This will check your API key configuration.
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={handleTestStripe}
                    disabled={testingStripe}
                    className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 disabled:opacity-50 flex items-center gap-2"
                  >
                    {testingStripe ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Testing...
                      </>
                    ) : (
                      'Yes, Test Stripe'
                    )}
                  </button>
                  <button
                    onClick={() => setConfirmDialogs({ ...confirmDialogs, stripe: false })}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setConfirmDialogs({ ...confirmDialogs, stripe: true })}
                disabled={testingStripe}
                className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
              >
                Test Stripe Connection
              </button>
            )}

            {stripeResult && (
              <div className={`mt-4 p-4 border-2 rounded-lg ${getStatusColor(stripeResult.status, stripeResult.configured)}`}>
                <div className="flex items-start gap-3">
                  {getStatusIcon(stripeResult.status, stripeResult.configured)}
                  <div className="flex-1">
                    <p className="font-medium text-gray-900 whitespace-pre-line">{stripeResult.message}</p>
                    
                    {stripeResult.modeLabel && (
                      <p className="mt-2 text-sm font-semibold text-blue-700">Mode: {stripeResult.modeLabel}</p>
                    )}
                    
                    {stripeResult.hasPublishableKey !== undefined && (
                      <div className="mt-2 text-sm text-gray-600">
                        <p>Configured: <span className="font-medium">{stripeResult.configured ? 'Yes' : 'No'}</span></p>
                        {stripeResult.publishableKeyPreview && (
                          <p>Publishable Key: <span className="font-medium">{stripeResult.publishableKeyPreview}</span></p>
                        )}
                      </div>
                    )}
                    
                    {stripeResult.testPaymentIntentId && (
                      <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                        <p className="text-sm font-semibold text-blue-900 mb-2">Test PaymentIntent Details:</p>
                        <div className="text-sm text-blue-800 space-y-1">
                          <p>ID: <span className="font-mono font-medium">{stripeResult.testPaymentIntentId}</span></p>
                          {stripeResult.testAmount && stripeResult.testCurrency && (
                            <p>Amount: <span className="font-medium">{stripeResult.testAmount} {stripeResult.testCurrency}</span></p>
                          )}
                          {stripeResult.dashboardUrl && (
                            <a href={stripeResult.dashboardUrl} target="_blank" rel="noopener noreferrer" 
                               className="text-blue-600 hover:text-blue-800 underline">
                              View in Stripe Dashboard →
                            </a>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Test Stripe Connection (PRODUCTION/LIVE) */}
          <div className="bg-white rounded-lg shadow p-6 border-2 border-red-200">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-semibold text-red-900">
                  Test Stripe Connection <span className="text-sm font-normal text-red-700">(PRODUCTION/LIVE)</span>
                </h2>
                <p className="text-sm text-red-600 mt-1">
                  ⚠️ <strong>WARNING:</strong> This will create a REAL transaction in LIVE mode. Only use this with production keys (sk_live_*).
                </p>
              </div>
            </div>

            {confirmDialogs.stripeProd ? (
              <div className="mb-4 p-4 bg-red-100 border-2 border-red-400 rounded-lg">
                <p className="text-red-900 font-bold mb-2 text-lg">
                  ⚠️ WARNING: This will create a REAL transaction!
                </p>
                <p className="text-red-800 mb-3">
                  This test will create an actual PaymentIntent using LIVE Stripe keys (sk_live_*).
                  This is a REAL transaction that will appear in your production Stripe Dashboard.
                  <br />
                  <strong>Only proceed if you have configured LIVE keys and understand the implications.</strong>
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={handleTestStripeProd}
                    disabled={testingStripeProd}
                    className="px-4 py-2 bg-red-700 text-white rounded-lg hover:bg-red-800 disabled:opacity-50 flex items-center gap-2 font-bold"
                  >
                    {testingStripeProd ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Testing...
                      </>
                    ) : (
                      '⚠️ Yes, Test LIVE Mode'
                    )}
                  </button>
                  <button
                    onClick={() => setConfirmDialogs({ ...confirmDialogs, stripeProd: false })}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setConfirmDialogs({ ...confirmDialogs, stripeProd: true })}
                disabled={testingStripeProd}
                className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 font-semibold"
              >
                Test Stripe PROD Connection
              </button>
            )}

            {stripeProdResult && (
              <div className={`mt-4 p-4 border-2 rounded-lg ${getStatusColor(stripeProdResult.status, stripeProdResult.configured)}`}>
                <div className="flex items-start gap-3">
                  {getStatusIcon(stripeProdResult.status, stripeProdResult.configured)}
                  <div className="flex-1">
                    <p className="font-medium text-gray-900 whitespace-pre-line">{stripeProdResult.message}</p>
                    
                    {stripeProdResult.modeLabel && (
                      <p className="mt-2 text-sm font-semibold text-red-700">Mode: {stripeProdResult.modeLabel}</p>
                    )}
                    
                    {stripeProdResult.warning && (
                      <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-sm text-yellow-800">
                        {stripeProdResult.warning}
                      </div>
                    )}
                    
                    {stripeProdResult.hasPublishableKey !== undefined && (
                      <div className="mt-2 text-sm text-gray-600">
                        <p>Configured: <span className="font-medium">{stripeProdResult.configured ? 'Yes' : 'No'}</span></p>
                        {stripeProdResult.publishableKeyPreview && (
                          <p>Publishable Key: <span className="font-medium">{stripeProdResult.publishableKeyPreview}</span></p>
                        )}
                      </div>
                    )}
                    
                    {stripeProdResult.testPaymentIntentId && (
                      <div className="mt-3 p-3 bg-red-50 rounded-lg border border-red-200">
                        <p className="text-sm font-semibold text-red-900 mb-2">⚠️ LIVE PaymentIntent Details:</p>
                        <div className="text-sm text-red-800 space-y-1">
                          <p>ID: <span className="font-mono font-medium">{stripeProdResult.testPaymentIntentId}</span></p>
                          {stripeProdResult.testAmount && stripeProdResult.testCurrency && (
                            <p>Amount: <span className="font-medium">{stripeProdResult.testAmount} {stripeProdResult.testCurrency}</span></p>
                          )}
                          {stripeProdResult.dashboardUrl && (
                            <a href={stripeProdResult.dashboardUrl} target="_blank" rel="noopener noreferrer" 
                               className="text-red-600 hover:text-red-800 underline font-semibold">
                              View in Stripe Dashboard →
                            </a>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Delete Everything */}
          <div className="bg-white rounded-lg shadow p-6 border-2 border-red-200">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-semibold text-red-900">⚠️ Delete Everything</h2>
                <p className="text-sm text-red-600 mt-1">
                  Permanently deletes ALL products, orders, transactions, carts, favorites, reviews, and cleans S3 bucket.
                  <br />
                  <strong className="font-bold">This action cannot be undone!</strong>
                </p>
              </div>
            </div>

            {!confirmDialogs.deleteEverything ? (
              <button
                onClick={() => setConfirmDialogs({ ...confirmDialogs, deleteEverything: true })}
                disabled={deletingEverything}
                className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 font-semibold"
              >
                Delete Everything
              </button>
            ) : !confirmDialogs.deleteEverythingSecond ? (
              <div className="mb-4 p-4 bg-red-50 border-2 border-red-300 rounded-lg">
                <p className="text-red-900 font-bold mb-2 text-lg">
                  ⚠️ FIRST CONFIRMATION: Are you absolutely sure?
                </p>
                <p className="text-red-800 mb-3">
                  This will delete:
                  <ul className="list-disc list-inside mt-2 space-y-1">
                    <li>All products and product images</li>
                    <li>All orders and payments</li>
                    <li>All carts and cart items</li>
                    <li>All user favorites</li>
                    <li>All product reviews</li>
                    <li>All analytics data</li>
                    <li>All addresses</li>
                    <li>All files in S3 products/ folder</li>
                  </ul>
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setConfirmDialogs({ ...confirmDialogs, deleteEverythingSecond: true })}
                    disabled={deletingEverything}
                    className="px-4 py-2 bg-red-700 text-white rounded-lg hover:bg-red-800 disabled:opacity-50 font-bold"
                  >
                    Yes, I Understand - Continue
                  </button>
                  <button
                    onClick={() => setConfirmDialogs({ ...confirmDialogs, deleteEverything: false })}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="mb-4 p-4 bg-red-100 border-4 border-red-500 rounded-lg">
                <p className="text-red-900 font-bold mb-2 text-xl">
                  ⚠️ SECOND CONFIRMATION: Final Warning!
                </p>
                <p className="text-red-800 mb-3 font-semibold">
                  This is your LAST chance to cancel. All data will be permanently deleted and cannot be recovered.
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={handleDeleteEverything}
                    disabled={deletingEverything}
                    className="px-4 py-2 bg-red-800 text-white rounded-lg hover:bg-red-900 disabled:opacity-50 font-bold flex items-center gap-2"
                  >
                    {deletingEverything ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Deleting...
                      </>
                    ) : (
                      '⚠️ DELETE EVERYTHING NOW'
                    )}
                  </button>
                  <button
                    onClick={() => setConfirmDialogs({ ...confirmDialogs, deleteEverything: false, deleteEverythingSecond: false })}
                    disabled={deletingEverything}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {deleteResult && (
              <div className={`mt-4 p-4 border-2 rounded-lg ${getStatusColor(deleteResult.status, deleteResult.success)}`}>
                <div className="flex items-start gap-3">
                  {getStatusIcon(deleteResult.status, deleteResult.success)}
                  <div className="flex-1">
                    <p className="font-medium text-gray-900 whitespace-pre-line">{deleteResult.message}</p>
                    
                    {deleteResult.deletedDatabaseRecords !== undefined && (
                      <div className="mt-4 space-y-2">
                        <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                          <p className="text-sm font-semibold text-gray-700 mb-2">
                            📊 Summary:
                          </p>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                            <p className="text-gray-600">
                              Database Records: <span className="font-bold text-gray-900">{deleteResult.deletedDatabaseRecords.toLocaleString()}</span>
                            </p>
                            {deleteResult.deletedS3Files !== undefined && deleteResult.deletedS3Files > 0 && (
                              <p className="text-gray-600">
                                Storage Files: <span className="font-bold text-gray-900">{deleteResult.deletedS3Files.toLocaleString()}</span>
                              </p>
                            )}
                          </div>
                        </div>

                        {deleteResult.breakdown && Object.keys(deleteResult.breakdown).length > 0 && (
                          <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                            <p className="text-sm font-semibold text-blue-900 mb-3">
                              📋 Detailed Breakdown by Table:
                            </p>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                              {Object.entries(deleteResult.breakdown)
                                .filter(([_, count]) => count > 0)
                                .map(([tableName, count]) => (
                                  <div key={tableName} className="flex justify-between items-center text-sm py-1 px-2 bg-white rounded border border-blue-100">
                                    <span className="text-gray-700">{tableName}:</span>
                                    <span className="font-bold text-blue-900">{Number(count).toLocaleString()}</span>
                                  </div>
                                ))}
                            </div>
                            {Object.values(deleteResult.breakdown).every(count => count === 0) && (
                              <p className="text-sm text-gray-500 italic">No records found to delete.</p>
                            )}
                          </div>
                        )}

                        {deleteResult.s3Error && (
                          <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-200 mt-2">
                            <p className="text-sm font-semibold text-yellow-900 mb-1">
                              ⚠️ Storage Cleanup Warning:
                            </p>
                            <p className="text-sm text-yellow-800">
                              {deleteResult.s3Error}
                            </p>
                            <p className="text-xs text-yellow-700 mt-1 italic">
                              Note: Database cleanup completed successfully. Storage cleanup can be retried separately.
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}

