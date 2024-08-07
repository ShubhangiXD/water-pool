// shader/fragmentShader.glsl
uniform float time;
uniform vec2 resolution;
uniform vec2 mouse;
varying vec2 vUv;

void main() {
  vec2 st = vUv * resolution.xy / min(resolution.x, resolution.y);
  vec2 toCenter = mouse - st;
  float dist = length(toCenter);
  float ripple = sin(dist * 10.0 - time * 5.0) * 0.1;
  vec3 color = vec3(0.0, 1.0, 1.0) * ripple;
  gl_FragColor = vec4(color, 1.0);
}
