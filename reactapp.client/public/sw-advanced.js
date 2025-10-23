// Advanced Service Worker for 保育園保護者ポータル
// オフライン機能、データ同期、バックグラウンド同期対応

const CACHE_NAME = 'nursery-portal-v2';
const DATA_CACHE_NAME = 'nursery-data-v2';
const SYNC_CACHE_NAME = 'nursery-sync-v2';

// キャッシュするリソース
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon-192x192.png',
  '/icon-512x512.png',
  '/offline.html' // オフライン専用ページ
];

// オフライン時に利用可能なAPIエンドポイント
const CACHEABLE_APIS = [
  '/api/children',
  '/api/dailyreports',
  '/api/photos',
  '/api/events',
  '/api/notifications',
  '/api/family'
];

// データ同期キューの管理
const SYNC_QUEUE_KEY = 'syncQueue';
const OFFLINE_ACTIONS_KEY = 'offlineActions';

// Service Worker インストール時
self.addEventListener('install', (event) => {
  console.log('Advanced Service Worker installing...');

  event.waitUntil(
    Promise.all([
      // 静的アセットをキャッシュ
      caches.open(CACHE_NAME).then((cache) => {
        console.log('Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      }),
      // データキャッシュとシンクキャッシュを初期化
      caches.open(DATA_CACHE_NAME),
      caches.open(SYNC_CACHE_NAME),
      // オフライン用ページを作成
      createOfflinePage()
    ])
  );

  self.skipWaiting();
});

// Service Worker アクティブ化時
self.addEventListener('activate', (event) => {
  console.log('Advanced Service Worker activating...');

  event.waitUntil(
    Promise.all([
      // 古いキャッシュを削除
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((cacheName) =>
              cacheName !== CACHE_NAME &&
              cacheName !== DATA_CACHE_NAME &&
              cacheName !== SYNC_CACHE_NAME
            )
            .map((cacheName) => {
              console.log('Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            })
        );
      }),
      // すべてのクライアントを制御
      self.clients.claim(),
      // 未同期データの確認
      checkPendingSyncData()
    ])
  );
});

// ネットワークリクエスト処理
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // POST/PUT/DELETE リクエスト（データ更新）の処理
  if (['POST', 'PUT', 'DELETE'].includes(request.method)) {
    event.respondWith(handleDataMutation(request));
    return;
  }

  // API GET リクエストの処理
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(handleApiRequest(request));
    return;
  }

  // 静的リソースの処理
  if (request.method === 'GET') {
    event.respondWith(handleStaticRequest(request));
    return;
  }
});

// データ更新リクエストの処理（POST/PUT/DELETE）
async function handleDataMutation(request) {
  try {
    // オンラインの場合は直接送信
    const response = await fetch(request.clone());

    if (response.ok) {
      // 成功時はローカルキャッシュも更新
      await updateLocalCache(request, response.clone());
      return response;
    }

    throw new Error(`HTTP ${response.status}`);

  } catch (error) {
    console.log('Data mutation failed, storing for background sync:', error);

    // オフライン時は同期キューに保存
    await storeForBackgroundSync(request);

    // 楽観的UI更新用のレスポンスを返す
    return new Response(
      JSON.stringify({
        success: true,
        message: 'データを保存しました。接続復旧時に自動同期されます。',
        offline: true,
        timestamp: Date.now()
      }),
      {
        status: 202, // Accepted
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}

// API GETリクエストの処理
async function handleApiRequest(request) {
  const url = new URL(request.url);

  // キャッシュ可能なAPIかチェック
  const isCacheable = CACHEABLE_APIS.some(pattern =>
    url.pathname.startsWith(pattern)
  );

  if (!isCacheable) {
    // キャッシュ不可のAPIは直接通信
    try {
      return await fetch(request);
    } catch (error) {
      return createOfflineResponse();
    }
  }

  try {
    // Network First戦略
    const response = await fetch(request);

    if (response.ok) {
      // 成功時はキャッシュを更新
      const cache = await caches.open(DATA_CACHE_NAME);
      await cache.put(request, response.clone());
      return response;
    }

    throw new Error(`HTTP ${response.status}`);

  } catch (error) {
    console.log('Network request failed, trying cache:', error);

    // ネットワーク失敗時はキャッシュから取得
    const cache = await caches.open(DATA_CACHE_NAME);
    const cachedResponse = await cache.match(request);

    if (cachedResponse) {
      // キャッシュデータにオフラインマーカーを追加
      const data = await cachedResponse.json();
      return new Response(
        JSON.stringify({
          ...data,
          _offline: true,
          _cachedAt: Date.now()
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    return createOfflineResponse();
  }
}

// 静的リクエストの処理
async function handleStaticRequest(request) {
  try {
    // Cache First戦略
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }

    const response = await fetch(request);

    if (response && response.status === 200) {
      const cache = await caches.open(CACHE_NAME);
      await cache.put(request, response.clone());
    }

    return response;

  } catch (error) {
    console.log('Static request failed:', error);

    // ドキュメントリクエストの場合はオフラインページを表示
    if (request.destination === 'document') {
      const offlineResponse = await caches.match('/offline.html');
      return offlineResponse || createOfflineResponse();
    }

    throw error;
  }
}

// バックグラウンド同期用データ保存
async function storeForBackgroundSync(request) {
  try {
    const requestData = {
      url: request.url,
      method: request.method,
      headers: Object.fromEntries(request.headers.entries()),
      body: await request.text(),
      timestamp: Date.now(),
      id: generateUniqueId()
    };

    // IndexedDBに保存（簡略化のためlocalStorageを使用）
    const syncQueue = await getSyncQueue();
    syncQueue.push(requestData);
    await setSyncQueue(syncQueue);

    // バックグラウンド同期を登録
    if ('serviceWorker' in self && 'sync' in self.registration) {
      await self.registration.sync.register('data-sync');
    }

  } catch (error) {
    console.error('Failed to store data for background sync:', error);
  }
}

// バックグラウンド同期イベント
self.addEventListener('sync', (event) => {
  console.log('Background sync triggered:', event.tag);

  if (event.tag === 'data-sync') {
    event.waitUntil(performBackgroundSync());
  }
});

// バックグラウンド同期実行
async function performBackgroundSync() {
  try {
    const syncQueue = await getSyncQueue();

    if (syncQueue.length === 0) {
      console.log('No pending sync data');
      return;
    }

    console.log(`Processing ${syncQueue.length} pending sync items`);

    const results = [];

    for (const item of syncQueue) {
      try {
        const request = new Request(item.url, {
          method: item.method,
          headers: item.headers,
          body: item.body || undefined
        });

        const response = await fetch(request);

        if (response.ok) {
          results.push({ id: item.id, success: true });
          console.log('Sync successful for:', item.url);
        } else {
          results.push({ id: item.id, success: false, error: `HTTP ${response.status}` });
        }

      } catch (error) {
        console.error('Sync failed for item:', item.id, error);
        results.push({ id: item.id, success: false, error: error.message });
      }
    }

    // 成功したアイテムをキューから削除
    const successfulIds = results.filter(r => r.success).map(r => r.id);
    const remainingQueue = syncQueue.filter(item => !successfulIds.includes(item.id));

    await setSyncQueue(remainingQueue);

    // クライアントに同期結果を通知
    await notifyClientsOfSyncResults(results);

  } catch (error) {
    console.error('Background sync failed:', error);
  }
}

// プッシュ通知処理（高機能化）
self.addEventListener('push', (event) => {
  console.log('Push notification received');

  let notificationData = {
    title: '保育園保護者ポータル',
    body: '新しい通知があります',
    icon: '/icon-192x192.png',
    badge: '/icon-192x192.png'
  };

  try {
    if (event.data) {
      const data = event.data.json();
      notificationData = {
        title: data.title || notificationData.title,
        body: data.body || notificationData.body,
        icon: data.icon || notificationData.icon,
        badge: data.badge || notificationData.badge,
        data: data.data || {},
        tag: data.tag || 'general',
        requireInteraction: data.priority === 'high',
        silent: data.priority === 'low'
      };

      // 通知タイプ別の設定
      if (data.type === 'emergency') {
        notificationData.requireInteraction = true;
        notificationData.vibrate = [200, 100, 200, 100, 200];
      }
    }
  } catch (error) {
    console.error('Failed to parse push data:', error);
  }

  const options = {
    body: notificationData.body,
    icon: notificationData.icon,
    badge: notificationData.badge,
    vibrate: notificationData.vibrate || [200, 100, 200],
    data: notificationData.data,
    tag: notificationData.tag,
    requireInteraction: notificationData.requireInteraction || false,
    silent: notificationData.silent || false,
    actions: [
      {
        action: 'view',
        title: '確認する',
        icon: '/icon-192x192.png'
      },
      {
        action: 'dismiss',
        title: '閉じる'
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification(notificationData.title, options)
  );
});

// 通知クリック処理
self.addEventListener('notificationclick', (event) => {
  console.log('Notification clicked:', event.action);
  event.notification.close();

  if (event.action === 'view') {
    const targetUrl = event.notification.data?.url || '/';

    event.waitUntil(
      clients.matchAll({ type: 'window' }).then((clientList) => {
        // 既存のウィンドウがあれば最前面に
        for (const client of clientList) {
          if (client.url === targetUrl && 'focus' in client) {
            return client.focus();
          }
        }

        // 新しいウィンドウを開く
        if (clients.openWindow) {
          return clients.openWindow(targetUrl);
        }
      })
    );
  }
});

// ユーティリティ関数
async function createOfflinePage() {
  const offlineHTML = `
    <!DOCTYPE html>
    <html lang="ja">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>オフライン - 保育園保護者ポータル</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; text-align: center; padding: 50px 20px; }
        .offline-icon { font-size: 64px; margin-bottom: 20px; }
        h1 { color: #333; margin-bottom: 10px; }
        p { color: #666; line-height: 1.6; }
        .retry-btn { background: #007AFF; color: white; border: none; padding: 12px 24px; border-radius: 8px; font-size: 16px; cursor: pointer; margin-top: 20px; }
      </style>
    </head>
    <body>
      <div class="offline-icon">📱</div>
      <h1>オフラインモード</h1>
      <p>インターネット接続が確認できません。<br>接続を確認して再度お試しください。</p>
      <p>一部の機能はオフラインでもご利用いただけます。</p>
      <button class="retry-btn" onclick="location.reload()">再試行</button>
    </body>
    </html>
  `;

  const cache = await caches.open(CACHE_NAME);
  await cache.put('/offline.html', new Response(offlineHTML, {
    headers: { 'Content-Type': 'text/html' }
  }));
}

function createOfflineResponse() {
  return new Response(
    JSON.stringify({
      success: false,
      message: 'オフラインです。インターネット接続を確認してください。',
      offline: true
    }),
    {
      status: 503,
      headers: { 'Content-Type': 'application/json' }
    }
  );
}

function generateUniqueId() {
  return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

async function getSyncQueue() {
  try {
    const stored = localStorage.getItem(SYNC_QUEUE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    return [];
  }
}

async function setSyncQueue(queue) {
  try {
    localStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(queue));
  } catch (error) {
    console.error('Failed to save sync queue:', error);
  }
}

async function updateLocalCache(request, response) {
  const url = new URL(request.url);

  if (CACHEABLE_APIS.some(pattern => url.pathname.startsWith(pattern))) {
    const cache = await caches.open(DATA_CACHE_NAME);
    await cache.put(request, response);
  }
}

async function checkPendingSyncData() {
  const syncQueue = await getSyncQueue();

  if (syncQueue.length > 0) {
    console.log(`Found ${syncQueue.length} pending sync items`);

    // 接続可能な場合は即座に同期を試行
    if (navigator.onLine) {
      setTimeout(() => performBackgroundSync(), 1000);
    }
  }
}

async function notifyClientsOfSyncResults(results) {
  const clients = await self.clients.matchAll();

  for (const client of clients) {
    client.postMessage({
      type: 'SYNC_COMPLETE',
      results: results,
      timestamp: Date.now()
    });
  }
}

// 定期バックグラウンド同期（実験的機能）
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'periodic-data-sync') {
    event.waitUntil(performPeriodicSync());
  }
});

async function performPeriodicSync() {
  console.log('Performing periodic background sync');

  try {
    // 重要なデータの定期同期
    const importantEndpoints = [
      '/api/notifications',
      '/api/events',
      '/api/children'
    ];

    for (const endpoint of importantEndpoints) {
      try {
        const response = await fetch(endpoint);
        if (response.ok) {
          const cache = await caches.open(DATA_CACHE_NAME);
          await cache.put(endpoint, response);
        }
      } catch (error) {
        console.log(`Periodic sync failed for ${endpoint}:`, error);
      }
    }

  } catch (error) {
    console.error('Periodic sync failed:', error);
  }
}