pkgs: dir: (pkgs.poetry2nix.mkPoetryEnv {
  python = pkgs.python312;
  projectDir = ../.;
  preferWheels = true;

  # editablePackageSources = { mpyc = ../mpyc; };

  # extraPackages = ps:
  #   [
  #     (pkgs.python311Packages.buildPythonPackage {
  #       name = "mpyc";
  #       src = ../mpyc;
  #     })
  #   ];

  # overrides = pkgs.poetry2nix.overrides.withDefaults (self: super: {
  #   didcomm = super.didcomm.overrideAttrs
  #     (old: { buildInputs = old.buildInputs ++ [ super.setuptools ]; });
  #   peerdid = super.peerdid.overrideAttrs
  #     (old: { buildInputs = old.buildInputs ++ [ super.setuptools ]; });
  #   pyodide-py = super.pyodide-py.overrideAttrs
  #     (old: { buildInputs = old.buildInputs ++ [ super.setuptools ]; });

  #   pandas = super.pandas.overrideAttrs (old: {
  #     buildInputs = old.buildInputs ++ [ super.setuptools super.asdqwrsdfsdf ];
  #   });
  #   matplotlib = super.matplotlib.overrideAttrs (old: {
  #     buildInputs = old.buildInputs ++ [ super.setuptools super.asdqwrsdfsdf ];
  #   });

  #   gmpy2 = pkgs.python312Packages.gmpy2;
  # });
})
