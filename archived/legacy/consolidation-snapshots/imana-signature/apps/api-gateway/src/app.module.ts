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

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    PortalDatabaseModule,
    OdooModule,
    OrdersModule,
    ProductsModule,
    ContactsModule,
    CatalogImportModule,
    PartnerImportModule,
    CmsModule,
    AnalyticsModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
