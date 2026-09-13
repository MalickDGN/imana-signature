import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OdooService } from '../integrations/odoo/odoo.service';
import { PortalDatabaseService } from '../portal-database/portal-database.service';

@Injectable()
export class OperationsService {
  constructor(private readonly odoo: OdooService, private readonly db: PortalDatabaseService, private readonly config: ConfigService) {}

  async overview() {
    const [orders, products, payments, etl, etlEvents] = await Promise.all([
      this.odoo.findSalesOrders([['state', 'in', ['sale', 'done']]], ['name', 'date_order', 'amount_total', 'partner_id', 'state', 'invoice_status', 'client_order_ref'], { limit: 50, order: 'date_order desc' }),
      this.odoo.findProducts([['sale_ok', '=', true]], ['qty_available']),
      this.db.isAvailable() ? this.db.query(`SELECT * FROM ${this.db.table('payment_transactions')} ORDER BY created_at DESC LIMIT 50`) : Promise.resolve({ rows: [] }),
      this.db.isAvailable() ? this.db.query(`SELECT id, object_type, file_name, status, environment, summary, created_at, updated_at FROM ${this.db.table('etl_jobs')} ORDER BY created_at DESC LIMIT 20`) : Promise.resolve({ rows: [] }),
      this.db.isAvailable() ? this.db.query(`SELECT e.id, e.job_id, e.event_type, e.details, e.happened_at, j.file_name FROM ${this.db.table('etl_job_events')} e JOIN ${this.db.table('etl_jobs')} j ON j.id = e.job_id ORDER BY e.happened_at DESC LIMIT 50`) : Promise.resolve({ rows: [] }),
    ]);
    const revenue = orders.reduce((sum, order) => sum + Number(order.amount_total ?? 0), 0);
    const customers = new Set(orders.map((order) => relationId(order.partner_id)).filter(Boolean)).size;
    return {
      metrics: { revenue, orders: orders.length, averageOrder: orders.length ? Math.round(revenue / orders.length) : 0, customers, lowStock: products.filter((product) => Number(product.qty_available ?? 0) <= 5).length, pendingPayments: payments.rows.filter((payment) => payment.status === 'pending').length, failedEtl: etl.rows.filter((job) => job.status === 'failed').length },
      recentOrders: orders.slice(0, 10).map((order) => ({ id: order.id, reference: order.name, date: order.date_order, amount: Number(order.amount_total ?? 0), customer: relationName(order.partner_id), status: order.state, invoiceStatus: order.invoice_status })),
      payments: payments.rows,
      etlJobs: etl.rows,
      etlEvents: etlEvents.rows,
      integrations: [
        { name: 'Odoo', status: 'operational', configured: true },
        { name: 'Wave', status: this.config.get('WAVE_API_KEY') ? 'configured' : 'not_configured', configured: Boolean(this.config.get('WAVE_API_KEY')) },
        { name: 'Orange Money', status: 'not_configured', configured: false },
        { name: 'PostgreSQL', status: this.db.isAvailable() ? 'operational' : 'unavailable', configured: this.db.isAvailable() },
      ],
    };
  }
}

function relationId(value: unknown): number { return Array.isArray(value) ? Number(value[0] ?? 0) : 0; }
function relationName(value: unknown): string { return Array.isArray(value) ? String(value[1] ?? '') : ''; }
