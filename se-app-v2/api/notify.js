export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const resendKey = process.env.RESEND_API_KEY;
  if (!resendKey) return res.status(500).json({ error: 'RESEND_API_KEY não configurada.' });

  const { to, postTitle, caption, network, scheduledAt, imageUrl } = req.body;
  if (!to) return res.status(400).json({ error: 'Email de destino obrigatório.' });

  const networkLabels = { instagram: 'Instagram', facebook: 'Facebook', linkedin: 'LinkedIn' };
  const networkLabel = networkLabels[network] || network;

  const networkLinks = {
    instagram: 'https://www.instagram.com',
    facebook:  'https://www.facebook.com',
    linkedin:  'https://www.linkedin.com/feed/'
  };
  const networkLink = networkLinks[network] || '#';

  const html = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8"/>
<style>
  body{font-family:Arial,sans-serif;background:#f4f4f4;margin:0;padding:0;}
  .wrap{max-width:560px;margin:32px auto;background:#fff;border-radius:8px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,.08);}
  .header{background:#FF5C00;padding:24px 32px;display:flex;align-items:center;gap:12px;}
  .header h1{color:#fff;font-size:18px;letter-spacing:3px;margin:0;font-family:Arial,sans-serif;}
  .body{padding:28px 32px;}
  .alert{background:#FFF3ED;border-left:4px solid #FF5C00;padding:14px 18px;border-radius:4px;margin-bottom:24px;}
  .alert p{margin:0;color:#333;font-size:14px;line-height:1.6;}
  .alert strong{color:#FF5C00;}
  .label{font-size:11px;letter-spacing:2px;text-transform:uppercase;color:#999;margin-bottom:6px;}
  .value{font-size:15px;color:#222;margin-bottom:18px;line-height:1.5;}
  .caption-box{background:#f9f9f9;border:1px solid #eee;border-radius:4px;padding:14px;font-size:14px;color:#444;line-height:1.7;margin-bottom:24px;white-space:pre-wrap;}
  .btn{display:inline-block;background:#FF5C00;color:#fff;text-decoration:none;padding:13px 28px;border-radius:4px;font-size:14px;font-weight:bold;letter-spacing:1px;}
  .footer{background:#f9f9f9;padding:16px 32px;font-size:11px;color:#aaa;text-align:center;border-top:1px solid #eee;}
</style>
</head>
<body>
<div class="wrap">
  <div class="header">
    <h1>SALES ELEVATOR · ARTE.IA</h1>
  </div>
  <div class="body">
    <div class="alert">
      <p>🔔 <strong>Hora de postar!</strong> Seu post agendado está pronto para publicação no ${networkLabel}.</p>
    </div>

    <div class="label">Post</div>
    <div class="value">${postTitle || 'Sem título'}</div>

    <div class="label">Rede social</div>
    <div class="value">${networkLabel}</div>

    <div class="label">Horário agendado</div>
    <div class="value">${scheduledAt || '—'}</div>

    <div class="label">Legenda</div>
    <div class="caption-box">${caption || '(sem legenda)'}</div>

    <a href="${networkLink}" target="_blank" class="btn">Abrir ${networkLabel} e postar →</a>
  </div>
  <div class="footer">Sales Elevator · Assessoria Comercial B2B · arte.ia</div>
</div>
</body>
</html>`;

  try {
    const resp = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + resendKey
      },
      body: JSON.stringify({
        from: 'Sales Elevator Arte.IA <noreply@saleselevator.com.br>',
        to: [to],
        subject: '🔔 Hora de postar no ' + networkLabel + ' — ' + (postTitle || 'seu post'),
        html
      })
    });

    if (!resp.ok) {
      const err = await resp.json();
      return res.status(resp.status).json({ error: (err.message || 'Erro ao enviar email') });
    }

    return res.status(200).json({ ok: true });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
