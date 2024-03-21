import {
    SimpleSpanProcessor,
    BatchSpanProcessor
} from '@opentelemetry/sdk-trace-base';
import { NodeSDK } from '@opentelemetry/sdk-node';
import * as process from 'process';
import { HttpInstrumentation } from '@opentelemetry/instrumentation-http';
import { ExpressInstrumentation } from '@opentelemetry/instrumentation-express';
import { NestInstrumentation } from '@opentelemetry/instrumentation-nestjs-core';
import { getNodeAutoInstrumentations } from "@opentelemetry/auto-instrumentations-node";
import { Resource } from '@opentelemetry/resources';
import { SemanticResourceAttributes } from '@opentelemetry/semantic-conventions';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';

// Set below envs
// export OTEL_TRACES_EXPORTER="otlp"
// export OTEL_METRICS_EXPORTER="otlp"
// export OTEL_EXPORTER_OTLP_ENDPOINT="https://otelcol-uat.tkxel-team.com"
// export OTEL_SERVICE_NAME="uat-signal-obx-scheduling-service"

const oltpExporter = new OTLPTraceExporter({
    url: `https://otelcol-uat.tkxel-team.com/v1/traces`,
});

const traceExporter = oltpExporter;

const spanProcessor =
  process.env.NODE_ENV === `development`
    ? new SimpleSpanProcessor(traceExporter)
    : new BatchSpanProcessor(traceExporter);

export const otelSDK = new NodeSDK({
    resource: new Resource({
        [SemanticResourceAttributes.SERVICE_NAME]: `uat-signal-obx-scheduling-service`,
    }),
    spanProcessor: spanProcessor,
    instrumentations: [
        new HttpInstrumentation(),
        new ExpressInstrumentation(),
        new NestInstrumentation(),
        getNodeAutoInstrumentations()
    ],
});

// gracefully shut down the SDK on process exit
process.on('SIGTERM', () => {
    otelSDK
        .shutdown()
        .then(
            () => console.log('SDK shut down successfully'),
            (err) => console.log('Error shutting down SDK', err),
        )
        .finally(() => process.exit(0));
});

