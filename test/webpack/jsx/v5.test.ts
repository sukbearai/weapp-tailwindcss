import path from 'node:path'
import type { Compiler } from 'webpack'
import MiniCssExtractPlugin from 'mini-css-extract-plugin'
import { UnifiedWebpackPluginV5 } from '@/index'
import { getCompiler5, compile, readAssets, createLoader, getErrors, getWarnings } from '#test/helpers'
import { webpack5CasePath } from '#test/util'
// import postcss from 'postcss'
// import fs from 'fs/promises'

describe('webpack5 jsx plugin', () => {
  let compiler: Compiler
  let postcssPlugins
  beforeEach(() => {
    // const processor = postcss(postcssPlugins)
    postcssPlugins = [
      require('autoprefixer')(),
      require('tailwindcss')({
        theme: {
          extend: {}
        },
        plugins: [],
        corePlugins: {
          preflight: false
        },
        content: [path.resolve(webpack5CasePath, 'jsx/**/*.jsx')]
      }),
      require('postcss-rem-to-responsive-pixel')({
        rootValue: 32,
        propList: ['*'],
        transformUnit: 'rpx'
      })
    ]
    compiler = getCompiler5({
      mode: 'production',
      context: path.resolve(webpack5CasePath, 'jsx'),
      entry: {
        entry: './pages/index.jsx'
      },
      output: {
        path: path.resolve(__dirname, './dist'),
        filename: '[name].js',
        chunkFilename: '[id].[name].js'
      },
      plugins: [new MiniCssExtractPlugin()],
      module: {
        rules: [
          {
            test: /\.jsx?$/,
            // https://webpack.js.org/configuration/module/#useentry
            use: [
              createLoader(function (source) {
                return source
              }),

              {
                loader: 'babel-loader',
                options: {
                  presets: ['@babel/preset-react']
                }
              }
            ]
          },
          {
            test: /\.css$/i,
            use: [
              MiniCssExtractPlugin.loader,
              'css-loader',
              {
                loader: 'postcss-loader',
                options: {
                  postcssOptions: {
                    plugins: postcssPlugins
                  }
                }
              }
            ]
          }
        ]
      },
      externals: ['react', 'react-dom']
    })
  })
  it('common', async () => {
    new UnifiedWebpackPluginV5({
      mainCssChunkMatcher(name, appType) {
        return true // return path.basename(name) === 'index.css'
      },

      customReplaceDictionary: 'complex'
    }).apply(compiler)

    const stats = await compile(compiler)
    const assets = readAssets(compiler, stats)

    expect(assets).toMatchSnapshot('assets')
    expect(getErrors(stats)).toMatchSnapshot('errors')
    expect(getWarnings(stats)).toMatchSnapshot('warnings')
  })

  it('disabled true', async () => {
    new UnifiedWebpackPluginV5({
      mainCssChunkMatcher(name) {
        return path.basename(name) === 'index.css'
      },
      disabled: true
    }).apply(compiler)

    const stats = await compile(compiler)
    const assets = readAssets(compiler, stats)
    expect(assets).toMatchSnapshot('assets')
    expect(getErrors(stats)).toMatchSnapshot('errors')
    expect(getWarnings(stats)).toMatchSnapshot('warnings')
  })
})
