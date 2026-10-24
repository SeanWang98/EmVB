# [INPUT]: 依赖 flake.lock 固定的 nixpkgs 与 Bun 官方发布包。
# [OUTPUT]: 提供四个平台的 Bun 1.4.3、Node 24 开发环境与 Nix 格式器。
# [POS]: 根目录工具链入口；.envrc 自动加载，bun.lock 固定应用依赖。
# [PROTOCOL]: 变更时更新此头部，然后检查 AGENTS.md
{
  description = "EmVB development environment";

  inputs.nixpkgs.url = "github:NixOS/nixpkgs/nixos-26.05";

  outputs =
    { nixpkgs, ... }:
    let
      # ---- Bun 版本与 CI 一致；四个平台哈希已核对官方校验表。----
      bunVersion = "1.4.3";
      bunReleases = {
        aarch64-darwin = {
          asset = "bun-darwin-aarch64";
          hash = "sha256-gK/UwGm0am+o8+xSC+vHUKeEPkqNW5WD0prUNsAKNAM=";
        };
        x86_64-darwin = {
          asset = "bun-darwin-x64";
          hash = "sha256-YmYOZDjrhyJ4h3rMp34RUtXQMTJN82jUqBtCghFInS0=";
        };
        aarch64-linux = {
          asset = "bun-linux-aarch64";
          hash = "sha256-76mBPaXtckI7+Ef5FujSxHwNd2rdlyNUAmp14Q2pqiE=";
        };
        x86_64-linux = {
          asset = "bun-linux-x64";
          hash = "sha256-PnMFKNiXdfA/h/BcBnh8TfQJnQo38/JS57gpyyOBbhg=";
        };
      };
      forAllSystems = nixpkgs.lib.genAttrs (builtins.attrNames bunReleases);
    in
    {
      formatter = forAllSystems (system: nixpkgs.legacyPackages.${system}.nixfmt);

      devShells = forAllSystems (
        system:
        let
          pkgs = nixpkgs.legacyPackages.${system};
          release = bunReleases.${system};
          bun = pkgs.bun.overrideAttrs (_: {
            version = bunVersion;
            src = pkgs.fetchurl {
              url = "https://github.com/oven-sh/bun/releases/download/bun-v${bunVersion}/${release.asset}.zip";
              inherit (release) hash;
            };
            sourceRoot = release.asset;
          });
        in
        {
          # ---- 不引入编译器环境，保留 macOS 系统工具的查找路径。----
          default = pkgs.mkShellNoCC {
            packages = [
              bun
              pkgs.nodejs_24
            ];
          };
        }
      );
    };
}
