/**
 * アンケートページ用 共有カウンター API
 * --------------------------------------------------
 * 使い方:
 *   1. script.google.com で新規プロジェクトを作成し、このコードを貼り付ける
 *   2. 下の ADMIN_KEY を自分だけが知る文字列に変更する
 *   3. 「デプロイ」→「新しいデプロイ」→ 種類「ウェブアプリ」
 *        - 実行ユーザー: 自分
 *        - アクセスできるユーザー: 全員
 *   4. 発行された URL（https://script.google.com/macros/s/xxxx/exec）を
 *      index.html の GAS_URL に貼り付ける
 *
 * API（GETパラメータ）:
 *   ?action=get                          → 現在のカウントを返す
 *   ?action=increment                    → カウント +1 して返す
 *   ?action=set&value=1234&key=管理キー  → 任意の値にプリセット
 *   ?action=reset&key=管理キー           → 0 にリセット
 */

var ADMIN_KEY = 'ここを必ず変更してください';  // ★管理キー（set / reset に必要）
var PROP_KEY = 'anketo_count';                 // 保存用キー（変更不要）
var INITIAL_COUNT = 1234;                      // 一度も保存されていないときの初期値

function doGet(e) {
  return handleRequest(e);
}

function doPost(e) {
  return handleRequest(e);
}

function handleRequest(e) {
  var p = (e && e.parameter) || {};
  var action = p.action || 'get';

  // 同時アクセスでカウントがずれないようロックする
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(5000);
  } catch (err) {
    return jsonOutput({ status: 'error', message: '混み合っています。再度お試しください。' });
  }

  try {
    var props = PropertiesService.getScriptProperties();
    var count = parseInt(props.getProperty(PROP_KEY), 10);
    if (isNaN(count)) count = INITIAL_COUNT;

    if (action === 'get') {
      return jsonOutput({ status: 'ok', count: count });
    }

    if (action === 'increment') {
      count = count + 1;
      props.setProperty(PROP_KEY, String(count));
      return jsonOutput({ status: 'ok', count: count });
    }

    if (action === 'set') {
      if (p.key !== ADMIN_KEY) {
        return jsonOutput({ status: 'error', message: '管理キーが違います' });
      }
      var v = parseInt(p.value, 10);
      if (isNaN(v) || v < 0) {
        return jsonOutput({ status: 'error', message: '0以上の数値を指定してください' });
      }
      props.setProperty(PROP_KEY, String(v));
      return jsonOutput({ status: 'ok', count: v });
    }

    if (action === 'reset') {
      if (p.key !== ADMIN_KEY) {
        return jsonOutput({ status: 'error', message: '管理キーが違います' });
      }
      props.setProperty(PROP_KEY, '0');
      return jsonOutput({ status: 'ok', count: 0 });
    }

    return jsonOutput({ status: 'error', message: '不明なactionです' });
  } finally {
    lock.releaseLock();
  }
}

function jsonOutput(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
