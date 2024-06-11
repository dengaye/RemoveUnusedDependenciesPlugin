const HtmlWebpackPlugin = require('html-webpack-plugin');
const GraphHelpers = require('webpack/lib/GraphHelpers'); // 引入 GraphHelpers

class RemoveUnusedDependenciesPlugin {
  constructor(options) {
    this.options = options || {};
    this.targetEntries = this.options.targetEntries || null;
  }

  apply(compiler) {
    compiler.hooks.thisCompilation.tap('RemoveUnusedDependenciesPlugin', (compilation) => {
      const entryModules = new Map();
      const chunksToMerge = new Map();

      // 在 optimizeChunks 钩子中过滤模块
      compilation.hooks.optimizeChunks.tap('RemoveUnusedDependenciesPlugin', (chunks) => {
        compilation.entrypoints.forEach((entrypoint, entryName) => {
          if (this.targetEntries && !this.targetEntries.includes(entryName)) return;
          entryModules.set(entryName, new Set());
          entrypoint.chunks.forEach(chunk => {
            for (const module of chunk.modulesIterable) {
              if (module.resource) {
                entryModules.get(entryName).add(module);
              }
            }
          });
        });
      });

      // 在 optimizeChunksAdvanced 钩子中处理 chunks
      compilation.hooks.optimizeChunksAdvanced.tap({
        name: 'RemoveUnusedDependenciesPlugin',
        stage: 100
      }, (chunks) => {
        const vendorsChunk = chunks.find(chunk => chunk.name === 'vendors');

        if (vendorsChunk) {
          entryModules.forEach((usedModules, entryName) => {
            const remainingModules = [];
            const newChunkName = `${entryName}-vendors`;

            for (const module of vendorsChunk.modulesIterable) {
              if (usedModules.has(module)) {
                remainingModules.push(module);
              } else {
                module.reasons = module.reasons.filter(reason => reason.module !== vendorsChunk.entryModule);
              }
            }

            const vendorsChunkModulesSet = new Set();
            for (const module of vendorsChunk.modulesIterable) {
              vendorsChunkModulesSet.add(module);
            }

            const remainingModulesSet = new Set(remainingModules);

            const areSetsEqual = (set1, set2) => {
              if (set1.size !== set2.size) return false;
              for (const item of set1) {
                if (!set2.has(item)) return false;
              }
              return true;
            };

            if (areSetsEqual(remainingModulesSet, vendorsChunkModulesSet)) {
              vendorsChunk.addGroup(compilation.entrypoints.get(entryName));
              return;
            }

            if (remainingModules.length > 0) {
              const existingChunk = Array.from(chunksToMerge.keys()).find(chunk => {
                const existingModules = chunksToMerge.get(chunk);
                return existingModules.size === remainingModules.length &&
                  remainingModules.every(module => existingModules.has(module));
              });

              if (existingChunk) {
                const entrypoint = compilation.entrypoints.get(entryName);
                entrypoint.chunks = entrypoint.chunks.filter(chunk => chunk !== vendorsChunk);
                entrypoint.chunks.push(existingChunk);
              } else {
                const newVendorsChunk = compilation.addChunk(newChunkName);
                newVendorsChunk.chunkReason = 'Extracted remaining vendors modules';

                for (const module of remainingModules) {
                  GraphHelpers.connectChunkAndModule(newVendorsChunk, module);
                }

                chunksToMerge.set(newVendorsChunk, new Set(remainingModules));

                // const entrypoint = compilation.entrypoints.get(entryName);
                // entrypoint.chunks = entrypoint.chunks.filter(chunk => chunk !== vendorsChunk);
                // entrypoint.chunks.push(newVendorsChunk);

                const entrypoint = compilation.entrypoints.get(entryName);
                newVendorsChunk.addGroup(entrypoint);

                HtmlWebpackPlugin.getHooks(compilation).beforeEmit.tapAsync(
                  'RemoveUnusedDependenciesPlugin',
                  (data, cb) => {
                    if (data.plugin.options.chunks.includes(entryName)) {
                      data.plugin.options.chunks.push(newChunkName);
                    }
                    cb(null, data);
                  }
                );
              }
            }
          });

          for (const module of vendorsChunk.modulesIterable) {
            module.reasons = module.reasons.filter(reason => reason.module !== vendorsChunk.entryModule);
          }

          if (vendorsChunk.getNumberOfModules() === 0) {
            vendorsChunk.files.forEach(file => {
              delete compilation.assets[file];
            });
            compilation.chunks.splice(compilation.chunks.indexOf(vendorsChunk), 1);
          }
        }
      });
    });
  }
}

module.exports = RemoveUnusedDependenciesPlugin;
