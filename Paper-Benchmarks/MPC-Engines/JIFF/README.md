
# Sharing (is Caring :D)

* `share_array`
  - Although if not all parties share their input, somehow all parties need to provide an input array with the same length? <br>
    Though, the content doesn't seem to matter for these other parties; as also `null` can be passed.

# Docker

* In directory with Dockerfile: <br>
  `docker build -t jiff_sok .`
* Run temporary containers within a dedicated Docker network, which has setup the IP ranges for, e.g., 172.16.33.\*: <br>
  `docker run -it --rm --name=jiff_name --network=LAN-bridge --ip=172.16.33.9 -p 8080:8080 jiff_sok`
  - `-p` exposes a Container port to the Host
* Access client's HTML via the browser from a remote machine, e.g., via port forwarding (: `ssh -L 8080:ivm007.iaik.tugraz.at:8080 lvm-pw`

## Run JIFF clients - within Docker - via node.js

E.g. in `app` (standalone example): `node party.js 172.16.33.9 8080 "[1,2,3]" 3 ip 1`
* app_innerprod: `node party.js 172.16.33.9 8080 {path_to_input_file} 3 ip 1`
