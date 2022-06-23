import * as __ from '/node_modules/quick-perlin-noise-js/quick-noise.js' // adds a quickNoise object

const windowWidth = 1200
const windowHeight = 900
const game = new Phaser.Game({
  type: Phaser.AUTO,
  width: windowWidth,
  height: windowHeight,
  scene: {
    preload,
    create,
  },
})

function preload() { }

function create() {
  generateMap({
    phaser: this,
  })
}

class NoiseGenerator {
  #generators
  #octaves

  constructor({ octaves = [1.0, 0.25] }) {
    this.#generators = []
    this.#octaves = octaves

    for (let octaveNumber = 0; octaveNumber < this.#octaves.length; octaveNumber++) {
      this.#generators.push(quickNoise.create())
    }
  }

  noise({ x, y, frequency }) {
    let noiseValue = 0.0

    for (let octaveNumber = 0; octaveNumber < this.#octaves.length; octaveNumber++) {
      const octaveValue = this.#octaves[octaveNumber]
      const generator = this.#generators[octaveNumber]

      if (octaveValue > 0.0) {
        let noise = generator(x * frequency / octaveValue, y * frequency / octaveValue, 0)
        noise = (noise + 1.0) / 2.0 // convert from (-1, 1) to (0, 1)

        if (noise < 0.0) console.error('Low noise:', noise, x, y, frequency, octaveValue)
        if (noise > 1.0) console.error('High noise:', noise, x, y, frequency, octaveValue)

        noise = octaveValue * noise
        noiseValue += noise
      }
    }

    if (noiseValue < 0.0) console.error('Low avg noise:', noiseValue)
    if (noiseValue > this.#octaves.reduce((acc, current) => acc + current))
      console.error('High avg noise:', noiseValue, this.#octaves.reduce((acc, current) => acc + current))

    noiseValue = noiseValue / this.#octaves.reduce((acc, current) => acc + current)
    if (noiseValue < 0.0 || noiseValue > 1.0) console.error('Bad avg noise:', noiseValue)

    return this.#smooth(noiseValue)
  }

  // Stolen from https://github.com/junegunn/perlin_noise/blob/master/lib/perlin/curve.rb
  #smooth(x, passes = 1) {
    for (let i = 0; i <= passes; i ++) {
      x = 3.15 * (x ** 2) - 2.3 * (x ** 3) // modified cubic curve with lower peak
    }

    return x
  }
}

function generateMap({
  phaser,
  tileSize = 10,
  frequency = 0.004,
  seaLevel = 0.5,
}) {
  const noiseGenerator = new NoiseGenerator({})

  for (let x = 0; x < windowWidth; x += tileSize) {
    for (let y = 0; y < windowHeight; y += tileSize) {
      const noiseValue = noiseGenerator.noise({ x, y, frequency })
      const { color, opacity } = colorTile({ noiseValue, seaLevel })

      phaser.add.rectangle(
        x + (tileSize / 2),
        y + (tileSize / 2),
        tileSize,
        tileSize,
        color,
        opacity,
      )
    }
  }
}

function colorTile({ noiseValue, seaLevel, mountainLevel = 0.8 }) {
  const terrainColor = 0x83f28f
  const snowColor = 0xffffff
  const coastColor = 0x3792cb
  const seaColor = 0x296d98
  const oceanColor = 0x1c4966

  const seaDepthStart = seaLevel * 2.0 / 3.0
  const oceanDepthStart = seaLevel / 3.0

  let color
  let opacity = 1.0
  if (noiseValue < oceanDepthStart) color = oceanColor
  else if (noiseValue < seaDepthStart) color = seaColor
  else if (noiseValue < seaLevel) color = coastColor
  else if (noiseValue > mountainLevel) color = snowColor
  else {
    color = terrainColor
    opacity = 1 - ( (noiseValue - seaLevel) / (1 - seaLevel) )
  }

  return { color, opacity }
}
