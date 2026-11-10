import worker from '../cloud/worker.mjs';
export function onRequest(context) {
 return worker.fetch(context.request, context.env);
}
