import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { OdooModule } from './integrations/odoo/odoo.module';
import { OrdersModule } from './orders/orders.module';
import { ProductsModule } from './products/products.module';
import { ContactsModule } from './contacts/contacts.module';
import { CatalogImportModule } from './catalog-import/catalog-import.module';
import { PartnerImportModule } from './partner-import/partner-import.module';
import { PortalDatabaseModule } from './portal-database/portal-database.module';
import { CmsModule } from './cms/cms.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { AdminAuthModule } from './admin-auth/admin-auth.module';
import { OperationsModule } from './operations/operations.module';
import { AuditLogModule } from './audit-log/audit-log.module';
import { AdminUsersModule } from './admin-users/admin-users.module';
import { OrdersAdminModule } from './orders-admin/orders-admin.module';
import { TransactionsModule } from './transactions/transactions.module';
import { InvoicesModule } from './invoices/invoices.module';
import { DeliveriesModule } from './deliveries/deliveries.module';
import { StockMovementsModule } from './stock-movements/stock-movements.module';
import { MembersModule } from './members/members.module';
import { PaymentMethodsModule } from './payment-methods/payment-methods.module';
import { DeliveryZonesModule } from './delivery-zones/delivery-zones.module';
import { SeoModule } from './seo/seo.module';
import { IntegrationsStatusModule } from './integrations-status/integrations-status.module';
import { SocialPublicationsModule } from './social-publications/social-publications.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    PortalDatabaseModule,
    OdooModule,
    PaymentMethodsModule,
    DeliveryZonesModule,
    OrdersModule,
    ProductsModule,
    ContactsModule,
    CatalogImportModule,
    PartnerImportModule,
    CmsModule,
    AnalyticsModule,
    AdminAuthModule,
    OperationsModule,
    AuditLogModule,
    AdminUsersModule,
    OrdersAdminModule,
    TransactionsModule,
    InvoicesModule,
    DeliveriesModule,
    StockMovementsModule,
    MembersModule,
    SeoModule,
    IntegrationsStatusModule,
    SocialPublicationsModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
