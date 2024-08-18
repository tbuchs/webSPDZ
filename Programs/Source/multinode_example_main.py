import random

n_nodes_per_party = int(program.args[1])
n_threads_per_node = int(program.args[2])
n_ops_per_thread = int(program.args[3])

n_ops_per_node = n_threads_per_node * n_ops_per_thread
n_ops = n_nodes_per_party * n_ops_per_node
data = Array.create_from(sint(regint.inc(n_ops)))

listen_for_clients(15000)

ready = regint.Array(n_nodes_per_party)

@for_range(n_nodes_per_party)
def _(i):
    ready[accept_client_connection(15000)] = 1

runtime_error_if(sum(ready) != n_nodes_per_party, 'connection problems')

@for_range(n_nodes_per_party)
def _(i):
    data.get_vector(base=i * n_ops_per_node,
                    size=n_ops_per_node).write_fully_to_socket(i)

@for_range(n_nodes_per_party)
def _(i):
    data.assign_vector(sint.read_from_socket(i, size=n_ops_per_node),
                       base=i * n_ops_per_node)

for i in range(10):
    index = random.randrange(n_ops)
    value = data[index].reveal()
    runtime_error_if(value != index ** 2, '%s != %s', value, index ** 2)
