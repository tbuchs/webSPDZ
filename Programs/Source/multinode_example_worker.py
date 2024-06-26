n_threads = int(program.args[1])
n_ops_per_thread = int(program.args[2])
worker_id = int(program.args[3])

if len(program.args) > 4:
    host = program.args[4]
else:
    host = 'localhost'

n_ops = n_threads * n_ops_per_thread
data = sint.Array(n_ops)

main = init_client_connection(host, 15000, worker_id)

data.read_from_socket(main)

@for_range_opt_multithread(n_threads, n_ops)
def _(i):
    data[i] = data[i] ** 2

data.write_to_socket(main)
