"use strict";
import { defineConfig } from 'vitest/config';
export default defineConfig({
    test: {
        environment: 'node',
        include: ['src/**/*.spec.ts'],
        clearMocks: true,
        restoreMocks: true,
    },
});
//# sourceMappingURL=vitest.config.mjs.map