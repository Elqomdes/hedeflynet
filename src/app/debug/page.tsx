'use client';

import { useState } from 'react';

export default function DebugPage() {
  const [results, setResults] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const testMongoDBConnection = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/test-mongodb-connection');
      const data = await response.json();
      setResults({ type: 'mongodb', data });
    } catch (error) {
      setResults({ type: 'mongodb', error: error instanceof Error ? error.message : 'Unknown error' });
    } finally {
      setLoading(false);
    }
  };

  const createSampleData = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/test-create-sample-data', { method: 'POST' });
      const data = await response.json();
      setResults({ type: 'sample', data });
    } catch (error) {
      setResults({ type: 'sample', error: error instanceof Error ? error.message : 'Unknown error' });
    } finally {
      setLoading(false);
    }
  };

  const clearData = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/test-clear-data', { method: 'POST' });
      const data = await response.json();
      setResults({ type: 'clear', data });
    } catch (error) {
      setResults({ type: 'clear', error: error instanceof Error ? error.message : 'Unknown error' });
    } finally {
      setLoading(false);
    }
  };

  const testLogin = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/test-login', { method: 'POST' });
      const data = await response.json();
      setResults({ type: 'login', data });
    } catch (error) {
      setResults({ type: 'login', error: error instanceof Error ? error.message : 'Unknown error' });
    } finally {
      setLoading(false);
    }
  };

  const testDatabaseOperations = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/test-database-operations');
      const data = await response.json();
      setResults({ type: 'database', data });
    } catch (error) {
      setResults({ type: 'database', error: error instanceof Error ? error.message : 'Unknown error' });
    } finally {
      setLoading(false);
    }
  };

  const testHealthCheck = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/health-check');
      const data = await response.json();
      setResults({ type: 'health', data });
    } catch (error) {
      setResults({ type: 'health', error: error instanceof Error ? error.message : 'Unknown error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">MongoDB Debug Sayfası</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <button
            onClick={testHealthCheck}
            disabled={loading}
            className="bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white px-4 py-2 rounded-lg font-medium"
          >
            {loading ? 'Test Ediliyor...' : 'Health Check Test Et'}
          </button>
          
          <button
            onClick={testMongoDBConnection}
            disabled={loading}
            className="bg-green-500 hover:bg-green-600 disabled:bg-green-300 text-white px-4 py-2 rounded-lg font-medium"
          >
            {loading ? 'Test Ediliyor...' : 'MongoDB Bağlantısını Test Et'}
          </button>
          
          <button
            onClick={testLogin}
            disabled={loading}
            className="bg-yellow-500 hover:bg-yellow-600 disabled:bg-yellow-300 text-white px-4 py-2 rounded-lg font-medium"
          >
            {loading ? 'Test Ediliyor...' : 'Login Test Et'}
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <button
            onClick={createSampleData}
            disabled={loading}
            className="bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300 text-white px-4 py-2 rounded-lg font-medium"
          >
            {loading ? 'Oluşturuluyor...' : 'Test Verisi Oluştur'}
          </button>
          
          <button
            onClick={clearData}
            disabled={loading}
            className="bg-red-500 hover:bg-red-600 disabled:bg-red-300 text-white px-4 py-2 rounded-lg font-medium"
          >
            {loading ? 'Temizleniyor...' : 'Veriyi Temizle'}
          </button>
          
          <button
            onClick={testDatabaseOperations}
            disabled={loading}
            className="bg-purple-500 hover:bg-purple-600 disabled:bg-purple-300 text-white px-4 py-2 rounded-lg font-medium"
          >
            {loading ? 'Test Ediliyor...' : 'Veritabanı İşlemlerini Test Et'}
          </button>
        </div>

        {results && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">
              Test Sonuçları - {results.type === 'mongodb' ? 'MongoDB Bağlantısı' : 
                               results.type === 'database' ? 'Veritabanı İşlemleri' : 
                               results.type === 'sample' ? 'Test Verisi Oluşturma' :
                               results.type === 'clear' ? 'Veri Temizleme' :
                               results.type === 'login' ? 'Login Testi' :
                               'Health Check'}
            </h2>
            
            {results.error ? (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <h3 className="text-red-800 font-medium mb-2">Hata:</h3>
                <p className="text-red-700">{results.error}</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-medium text-gray-900 mb-2">Durum:</h3>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    results.data?.status === 'success' ? 'bg-green-100 text-green-800' :
                    results.data?.status === 'partial_success' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {results.data?.status || 'Bilinmeyen'}
                  </span>
                </div>
                
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-medium text-gray-900 mb-2">Mesaj:</h3>
                  <p className="text-gray-700">{results.data?.message}</p>
                </div>
                
                {results.data?.details && (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="font-medium text-gray-900 mb-2">Detaylar:</h3>
                    <pre className="text-sm text-gray-700 overflow-auto">
                      {JSON.stringify(results.data.details, null, 2)}
                    </pre>
                  </div>
                )}
                
                {results.data?.results && (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="font-medium text-gray-900 mb-2">Sonuçlar:</h3>
                    <pre className="text-sm text-gray-700 overflow-auto">
                      {JSON.stringify(results.data.results, null, 2)}
                    </pre>
                  </div>
                )}
                
                {results.data?.timestamp && (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="font-medium text-gray-900 mb-2">Zaman:</h3>
                    <p className="text-gray-700">{new Date(results.data.timestamp).toLocaleString('tr-TR')}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-blue-900 mb-3">MongoDB Bağlantı Bilgileri</h2>
          <div className="text-sm text-blue-800 space-y-2">
            <p><strong>Veritabanı:</strong> hedeflydatas</p>
            <p><strong>Host:</strong> hedeflydatas.8esydhl.mongodb.net</p>
            <p><strong>Kullanıcı:</strong> hedefly_db_user</p>
            <p><strong>Bağlantı Tipi:</strong> MongoDB Atlas (Cloud)</p>
          </div>
        </div>

        <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-yellow-900 mb-3">Sorun Giderme</h2>
          <div className="text-sm text-yellow-800 space-y-2">
            <p>• Eğer MongoDB bağlantı testi başarısız olursa, internet bağlantınızı kontrol edin</p>
            <p>• Veritabanı işlemleri testi başarısız olursa, MongoDB Atlas hesabınızı kontrol edin</p>
            <p>• Health check başarısız olursa, sunucunun çalıştığından emin olun</p>
            <p>• Öğrenci ekleme işlemi için öğretmen olarak giriş yapmanız gerekir</p>
          </div>
        </div>
      </div>
    </div>
  );
}
