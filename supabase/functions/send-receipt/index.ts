// Supabase Edge Function: төлбөр төлөгдсөн захиалгын баримтыг хэрэглэгчийн и-мэйлээр илгээнэ.
// Deploy: supabase functions deploy send-receipt
// Secrets: supabase secrets set RESEND_API_KEY=re_xxx RECEIPT_FROM="PLAYGRID <receipts@your-domain.com>"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
}
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, 'Content-Type': 'application/json' },
  })

const esc = (s: unknown) =>
  String(s ?? '').replace(
    /[&<>"']/g,
    (c) =>
      ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[
        c
      ]!,
  )
const money = (n: number) => new Intl.NumberFormat('en-US').format(n) + '₮'
const METHOD: Record<string, string> = {
  qpay: 'QPay',
  card: 'Банкны карт',
  points: 'Оноо',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })
  try {
    const url = Deno.env.get('SUPABASE_URL')!
    // Дуудсан хэрэглэгчийн эрхээр ажиллана → зөвхөн өөрийн захиалгыг уншина (RLS)
    const userClient = createClient(url, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: {
        headers: { Authorization: req.headers.get('Authorization') ?? '' },
      },
    })
    const {
      data: { user },
    } = await userClient.auth.getUser()
    if (!user?.email) return json({ error: 'Нэвтрээгүй байна' }, 401)

    const { order_id, resend } = await req.json()
    const { data: order } = await userClient
      .from('orders')
      .select('*')
      .eq('id', order_id)
      .eq('status', 'completed')
      .maybeSingle()
    if (!order) return json({ error: 'Захиалга олдсонгүй' }, 404)
    if (order.receipt_sent_at && !resend)
      return json({ ok: true, already: true, email: user.email })

    const apiKey = Deno.env.get('RESEND_API_KEY')
    if (!apiKey)
      return json({ error: 'RESEND_API_KEY тохируулаагүй байна' }, 500)

    const when = new Date(order.paid_at ?? order.created_at).toLocaleString(
      'mn-MN',
      { timeZone: 'Asia/Ulaanbaatar' },
    )
    const row = (k: string, v: string, bold = false) =>
      `<tr><td style="padding:6px 0;color:#6b7280">${k}</td><td style="padding:6px 0;text-align:right;${bold ? 'font-weight:800;font-size:18px' : ''}">${v}</td></tr>`

    const html = `<!doctype html><html><body style="margin:0;background:#f6f7f3;font-family:Arial,sans-serif;color:#111">
<div style="max-width:520px;margin:24px auto;background:#fff;border-radius:16px;overflow:hidden;border:1px solid #e6e8e0">
  <div style="padding:20px 24px;border-bottom:1px solid #e6e8e0"><span style="font-weight:900;font-size:22px">PLAY<span style="background:#c8f31d;padding:0 6px;border-radius:6px">GRID</span></span></div>
  <div style="padding:24px">
    <h2 style="margin:0 0 4px">Төлбөр амжилттай</h2>
    <p style="margin:0 0 18px;color:#6b7280">Баримт № ${esc(order.payment_ref)} · ${esc(when)}</p>
    <table style="width:100%;border-collapse:collapse;font-size:14px">
      ${row('Бүтээгдэхүүн', esc(order.product_title))}
      ${order.game_account !== '-' ? row('Тоглогчийн ID', esc(order.game_account)) : ''}
      ${row('Төлбөрийн хэрэгсэл', esc(METHOD[order.payment_method] ?? order.payment_method ?? '-'))}
      ${row('Үнэ', money(order.price))}
      ${order.discount > 0 ? row('Оноогоор хөнгөлсөн', '−' + money(order.discount)) : ''}
      <tr><td colspan="2"><hr style="border:0;border-top:1px dashed #e6e8e0"></td></tr>
      ${row('Төлсөн дүн', money(order.total), true)}
      ${row('Авсан оноо', '+' + esc(order.points_earned))}
    </table>
    <div style="margin:22px 0 6px;color:#6b7280;font-size:12px">Захиалгын / купон код</div>
    <div style="font:800 22px monospace;letter-spacing:2px;background:#f6f7f3;border:2px dashed #111;border-radius:12px;padding:14px;text-align:center">${esc(order.delivery_code)}</div>
  </div>
  <div style="padding:14px 24px;background:#f6f7f3;color:#6b7280;font-size:12px">Энэ бол автомат баримт. © 2026 PLAYGRID</div>
</div></body></html>`

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from:
          Deno.env.get('RECEIPT_FROM') ?? 'PLAYGRID <onboarding@resend.dev>',
        to: [user.email],
        subject: `PLAYGRID баримт — ${order.product_title}`,
        html,
      }),
    })
    if (!res.ok) return json({ error: await res.text() }, 502)

    // Илгээсэн цагийг service role-оор тэмдэглэнэ (хэрэглэгч энэ баганыг өөрчилж чадахгүй)
    const admin = createClient(url, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)
    await admin
      .from('orders')
      .update({ receipt_sent_at: new Date().toISOString() })
      .eq('id', order.id)

    return json({ ok: true, email: user.email })
  } catch (e) {
    return json({ error: String(e) }, 500)
  }
})
