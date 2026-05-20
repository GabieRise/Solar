export const earthVertexShader = `
  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vWorldPosition;

  void main() {
    vUv = uv;
    vNormal = normalize(normalMatrix * normal);
    vec4 worldPos = modelMatrix * vec4(position, 1.0);
    vWorldPosition = worldPos.xyz;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

export const earthFragmentShader = `
  uniform sampler2D dayTexture;
  uniform sampler2D nightTexture;
  uniform vec3 sunDirection;

  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vWorldPosition;

  void main() {
    vec3 day   = texture2D(dayTexture,   vUv).rgb;
    vec3 night = texture2D(nightTexture, vUv).rgb;

    // How much this fragment faces the sun (-1 to 1)
    float cosAngle = dot(vNormal, normalize(sunDirection));

    // Smooth blend across the terminator line
    float blend = smoothstep(-0.1, 0.2, cosAngle);

    // Boost night lights so city lights are visible
    vec3 nightBoosted = night * 1.8;

    gl_FragColor = vec4(mix(nightBoosted, day, blend), 1.0);
  }
`;