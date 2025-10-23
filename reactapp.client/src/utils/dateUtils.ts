/**
 * 通知日時のフォーマット関数
 * 3日以内は相対時刻（〇分前、〇時間前、〇日前）
 * 3日より古い場合はyyyy/mm/dd形式で表示
 */
export const formatNotificationTime = (dateString: string): string => {
  const now = new Date();
  const date = new Date(dateString);
  const diffMs = now.getTime() - date.getTime();
  
  // ミリ秒を各時間単位に変換
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
  // 3日以内の場合は相対時刻で表示
  if (diffDays < 3) {
    if (diffMinutes < 1) {
      return 'たった今';
    } else if (diffMinutes < 60) {
      return `${diffMinutes}分前`;
    } else if (diffHours < 24) {
      return `${diffHours}時間前`;
    } else {
      return `${diffDays}日前`;
    }
  }
  
  // 3日以降はyyyy/mm/dd形式で表示
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  
  return `${year}/${month}/${day}`;
};