const TOKEN_HOLDERS = [
  {
    "address": "0x3b067af83f540cb827825a6ee5480441a4237e77",
    "stakes": 67.74170277
  },
  {
    "address": "0xDc2aDfA800a1ffA16078Ef8C1F251D50DcDa1065",
    "stakes": 55.34047621
  },
  {
    "address": "0x949Bba9F1C13F2461835366AEBcb53c852dd4308",
    "stakes": 52.46893052
  },
  {
    "address": "0xb2821C0DF0c414ff51D3e8033CBA26DF6AaC587b",
    "stakes": 52.1194622
  },
  {
    "address": "0x625236038836CecC532664915BD0399647E7826b",
    "stakes": 35.65029081
  },
  {
    "address": "0x778549Eb292AC98A96a05E122967f22eFA003707",
    "stakes": 29.85946627
  },
  {
    "address": "0x42a63047a1cD8449e3E70aDEB7363C4Ca01DB528",
    "stakes": 29.26330596
  },
  {
    "address": "0xB3e43abf014cb2d8cF8dc3D8C2e62157E6093343",
    "stakes": 22.27608569
  },
  {
    "address": "0xB24b54FE5a3ADcB4cb3B27d31B6C7f7E9F6A73a7",
    "stakes": 18.61490061
  },
  {
    "address": "0x85eD40DbCa94B5BC73c6C7EC7f4eCaaD04A03a22",
    "stakes": 11.01467418
  },
  {
    "address": "0xDF290293C4A4d6eBe38Fd7085d7721041f927E0a",
    "stakes": 8.037073527
  },
  {
    "address": "0xc172542e7F4F625Bb0301f0BafC423092d9cAc71",
    "stakes": 6.88411335
  },
  {
    "address": "0x3c63B262c54f45Ba1Ca8E127F14a2B93fdc826ca",
    "stakes": 6.821412418
  },
  {
    "address": "0x23605990A938Cebf695C41f83628e02D92e4B27e",
    "stakes": 5.287854216
  },
  {
    "address": "0x30043aAbBCeBbD887437Ec4F0Cfe6d4c0eB5CC64",
    "stakes": 4.899835705
  },
  {
    "address": "0xc6b0a4c5BA85d082eCd4Fb05FBF63eb92AC1083a",
    "stakes": 4.685185168
  },
  {
    "address": "0x5b7575494b1e28974efe6EA71EC569b34958F72e",
    "stakes": 4.606964555
  },
  {
    "address": "0x85f9c38a44EfB45CeF47cBf510e6e18cDdf2a78A",
    "stakes": 4.270146094
  },
  {
    "address": "0x79D3544bBe7821f2be4bD745D3df1f14ED211C30",
    "stakes": 4.131271899
  },
  {
    "address": "0xf83775C95A00612D4CAc5053Dd484FfA81BaE0aD",
    "stakes": 4.120390606
  },
  {
    "address": "0x701d0ECB3BA780De7b2b36789aEC4493A426010a",
    "stakes": 3.82525381
  },
  {
    "address": "0x16B942C119D3e34ff8f801cf68EC6aA26F1dC494",
    "stakes": 1.612069523
  },
  {
    "address": "0x8De127aFabA3EC4BcCf5D91bBB68091B5F10954f",
    "stakes": 1.612069523
  },
  {
    "address": "0xEBa5a0235C8A79BBA5A7b585eA698184E96758DA",
    "stakes": 1.598651368
  },
  {
    "address": "0xA0f780d46F103DB59Cfc5ffeC8B25FfD36940EA7",
    "stakes": 1.269385889
  },
  {
    "address": "0x5202E694e9Fc9B097549619236f5EE3d059a4e95",
    "stakes": 0.9568948481
  },
  {
    "address": "0xf636C77Ffb54ED04fD869142D59968e5D6A2AB6c",
    "stakes": 0.8060347613
  },
  {
    "address": "0xB25eDb60F339BeBd56C634b5Db74495567B3335D",
    "stakes": 0.7509634626
  },
  {
    "address": "0x6D97d65aDfF6771b31671443a6b9512104312d3D",
    "stakes": 0.7429869979
  },
  {
    "address": "0x6473c68cC4D36FDfC5A9Fd280BF8832d0F51B8E1",
    "stakes": 0.5942252664
  },
  {
    "address": "0x874b3e815B02D3DCD5008FDEE96127c16292Ba1f",
    "stakes": 0.4666385249
  },
  {
    "address": "0x2920620b47D51170319A531A2D6D5810610E8C2A",
    "stakes": 0.4540678499
  },
  {
    "address": "0x3069F7FFe6B735dbeC3aAf0467Ba1Ba72CBBAd7d",
    "stakes": 0.3459307282
  },
  {
    "address": "0x7944FC7Bd79B25E6fFe24921d88A1f36f22bE843",
    "stakes": 0.3459307282
  },
  {
    "address": "0x27c72e4BD23C910218d8f06C4a1742E06657c874",
    "stakes": 0.2342592584
  },
  {
    "address": "0x628B3798E315d1F44999ac260E211c7819b35bc2",
    "stakes": 0.1138547335
  },
  {
    "address": "0xf503017D7baF7FBC0fff7492b751025c6A78179b",
    "stakes": 0.05575538483
  },
  {
    "address": "0x80FE61720fE2BB8B54b028f037189De0b13aa50b",
    "stakes": 0.01257067496
  }
]

const IMPACT_HOUR_RATE = 100

function convertStake(stake) {
  return Math.round(stake * IMPACT_HOUR_RATE * 1e18)
}

exports.HOLDERS = TOKEN_HOLDERS.map(({ address }) => address)

exports.STAKES = TOKEN_HOLDERS.map(({ stakes }) => convertStake(stakes))
