# three-js-metro-poc

Procedural Three.js metro tunnel rendering prototype.

## Tunnel rendering

`TunnelStyle` combines segment features, tunnel-wide features, LOD distances,
and the target render-chunk length. Each feature is configured once and builds
its own representation for the requested LOD level.

- Segment features implement `buildSegment(context)` and may implement
  `buildJunction(context)` when they need special intersection handling.
- Tunnel features implement `buildChunk(context)`. The manager supplies
  equally sized arc-length chunks so long features participate in local LOD.
- LOD distance thresholds live in `TunnelStyle`; feature variants are keyed by
  the LOD IDs, such as `detailed`, `medium`, and `low`.
- `context.curve` is translated so the chunk is centered near its local origin.
  `startU` and `endU` select that chunk on the complete path; `startDistance`,
  `endDistance`, and `totalLength` are measured in world units. Junction builds
  also receive `context.junction` with the peer cutter and branch index.

The example style is in `src/examples/tunnels/tunnel-style.js`. To add a segment
detail, implement a feature with an `id` and `buildSegment(context)`, then add it
to `segmentFeatures`. Implement `buildJunction(context)` only when its junction
behavior differs from its ordinary segment behavior.

