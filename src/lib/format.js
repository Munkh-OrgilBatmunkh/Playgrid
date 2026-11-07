export const money = (n) => new Intl.NumberFormat('mn-MN').format(n || 0) + '₮'

export const dateMn = (d) =>
  d ? new Date(d).toLocaleDateString('mn-MN', { year: 'numeric', month: 'long', day: 'numeric' }) : 'Тун удахгүй'
