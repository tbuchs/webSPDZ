
* Build dockerized MPyC-Web, e.g., with:
  - `cd Docker` --> `docker build -t your_mpyc_web_img_tag .`

## MPyC-Web Server
* Command to start server, and then build & run inside container (good for testing development:) 
  - ` docker run -it --rm --network=webSPDZ-Net --ip=172.16.37.9 -p 8000:8000 -v "{your_absolute_path}/Benchmarks/PyDock-Runners/Dock-Point/Share-Data:/home/Dock-Point/Share-Data" --cpus=4 --memory=4g --memory-swap=4g {docker_image_name}  "/bin/bash"`
  - // replace {your_absolute_path} accordingly ;)
  - // replace {docker_image_name} accordingly; like `mpyc_web_bench`
  - then in container: ` ./rebuild-n-start-demo.sh`
* Command to start server & run straight:
  - instead of "/bin/bash" from above, run the `./rebuild-n-start-demo.sh` script
  - `--cpus` restricts the amount of (logical) CPUs that are available for the container
  - `--memory-swap` defines the (RAM+swap) memory limit; so if it has the same value as `--memory`, swapping is disabled

* Notes
  - Some blogs recommend to increase shared memory size to, e.g., 2GB when running a Docker container which should perform WebRTC inside a simulated browser : `--shm-size=2g` <br>
    --> but we didn't observe a difference in our case(s) 

## MPyC-Web Party Clients

* Start Docker party via, e.g.:
  - `docker run -it --rm --name=MPyC-Web-Party-n --network=webSPDZ-Net -v '{your_absolute_path}/Benchmarks/PyDock-Runners/Dock-Point/Share-Data:/home/Dock-Point/Share-Data' -v '{your_absolute_path}/Benchmarks/PyDock-Runners/Dock-Point/Logs:/home/Dock-Point/Logs' -v '{your_absolute_path}/Benchmarks/PyDock-Runners/Dock-Point/Programs:/home/Dock-Point/Programs' --add-host mpc-s:172.16.37.9 --add-host peer-s:172.16.37.8 --cpus=4 --memory=4g --memory-swap=4g {docker_image_name} "/bin/bash"`
  - replace name tag's number with respective party nr. (in "--name=...")
  - // replace {your_absolute_path} accordingly ;)
  - // replace {docker_image_name} accordingly; like `mpyc_web_bench`
* Run selenium script via, e.g.:
 - `pipenv run iptyhon3`
 - then run with e.g.:<br>
   `run run-party_MPyC-Web_browser.py --nr_party_nodes 3 --run_timeout 1 --prog_name dot-product.mpyc.py --own_id_offset 0 --party_id_start_offset 0`

