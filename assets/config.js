// 公開設定。Stripe Payment Link が未設定（空文字）の間は、注文ボタンが #order の依頼フォームにフォールバックする。
window.AKIYA_CONFIG = {
  STRIPE_SINGLE: '',   // 例: 'https://buy.stripe.com/xxxx'（Single Report $49）
  STRIPE_COMPARE: '',  // 例: 'https://buy.stripe.com/yyyy'（Compare 3 $99）
  CONTACT: ['naoren.38', 'gmail.com'], // FormSubmit 送信先（結合して使用）
};
