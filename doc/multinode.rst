Multinode Computation Example
=============================

Multinode computation refers to the possibility of distributing a
every party across several nodes. MP-SPDZ uses the client interface
for communication between nodes. This means that you have to run
``Scripts/setup-clients.sh`` and distribute the certificates to run it
across several machines.

In the following, we will explain the example in
:download:`../Programs/Source/multinode_example_main.py` and
:download:`../Programs/Source/multinode_example_worker.py`.

First, the one main node per party, listens and accepts connections
from the worker nodes in the same logical party::

  listen_for_clients(15000)

  ready = regint.Array(n_nodes_per_party)

  @for_range(n_nodes)
  def _(i):
    ready[accept_client_connection(15000)] = 1

  runtime_error_if(sum(ready) != n_nodes_party, 'connection problems')

Maintaining :py:obj:`ready` helps spot errors but isn't strictly
necessary. Meanwhile, the workers connect to main node::

  main = init_client_connection(host, 15000, worker_id)

Once the connection is established, the main node distributes the data
among the workers::

  @for_range(n_nodes_per_party)
  def _(i):
    data.get_vector(base=i * n_ops_per_node,
      size=n_ops_per_node).write_fully_to_socket(i)

This sends a different chunk :py:obj:`data` to every node. The workers
then receive it and execute the computation (squaring every number in
the example), and send the result back::

  @for_range_opt_multithread(n_threads, n_ops)
  def _(i):
    data[i] = data[i] ** 2

  data.write_to_socket(main)

Finally, the main node receives the result::

  @for_range(n_nodes_per_party)
  def _(i):
    data.assign_vector(sint.read_from_socket(i, size=n_ops_per_node),
      base=i * n_ops_per_node)

You can execute example with three parties, four worker nodes per
party, five threads per worker node, and 1000 operations per thread as
follows::

  for i in $(seq 0 3); do
    Scripts/compile-run.py ring multinode_example_worker 5 1000 $i localhost & true
  done

  Scripts/compile-run.py ring multinode_example_main 4 5 1000
