import time 
import numpy as np
from mpyc.runtime import mpc

def get_result_plain(vec1, vec2, mod):
    res = 0
    for e1, e2 in zip(vec1, vec2):
        res += (e1*e2) % mod 

    res = res % mod
    return res 
    

async def main():
    # initialize mpc, define secure int type
    time_full_start = time.time_ns()
    await mpc.start()

    LEN = 10**5
    secint = mpc.SecInt(128)

    # party 0 & 1 sample the input vectors locally...
    time_input_start = time.time_ns()

    result_type = [secint()] * LEN
    if mpc.pid == 0:
        vec1 = [np.random.randint(1,1000) for _ in range(LEN)]
        vec1_input = [secint(v) for v in vec1]
        #print(f"party-{mpc.pid} gets vec1")
        
        vec2_input = result_type
    elif mpc.pid == 1:
        vec1_input = result_type
        
        vec2 = [np.random.randint(1,1000) for _ in range(LEN)]
        vec2_input = [secint(v) for v in vec2]
        #print(f"party-{mpc.pid} gets vec2")
    else:
        #print(f"party-{mpc.pid} only receives shares")
        vec1_input = result_type
        vec2_input = result_type

    # ...and secret-shares them with the others
    sec_vec1 = mpc.input(vec1_input, senders=0)
    sec_vec2 = mpc.input(vec2_input, senders=1)
    
    time_input_end = time.time_ns()
    
    # compute inner product
    time_innerprod_start = time.time_ns()
    ip = mpc.in_prod(sec_vec1, sec_vec2)
    time_innerprod_end = time.time_ns()
    
    # output result (to everybody)
    result_mpc = await mpc.output(ip)
    time_full_end = time.time_ns()

    time_full = (time_full_end - time_full_start) / 10**9
    time_input = (time_input_end - time_input_start) / 10**9
    time_innerprod = (time_innerprod_end - time_innerprod_start) / 10**9

    print(f'Party ID: {mpc.pid}')
    print('...times in sec:')
    print('<b3m4>{"timer": {"full": %f}}</b3m4>' % time_full)
    print('<b3m4>{"timer": {"input": %f}}</b3m4>' % time_input)
    print('<b3m4>{"timer": {"inner_prod": %f}}</b3m4>' % time_innerprod)

    p = secint.field.modulus
    print('<b3m4>{"result": %f}</b3m4>' % result_mpc)
    print('<b3m4>{"modulus": %d}</b3m4>' % p)
    
    #print("field modulus: ", p)
    vec1_plain = await mpc.output(sec_vec1)
    vec2_plain = await mpc.output(sec_vec2)
    #print("vec1 plain: ", vec1_plain)
    #print("vec2 plain: ", vec2_plain)

    result_plain = get_result_plain(vec1_plain, vec2_plain, p)
    print('Result MPC:   ', result_mpc)
    print('Result Plain: ', result_plain)
    if (result_mpc == result_plain):
        print('...hooray, the MPC & Plain results are equal :D')
    else:
        print('...wait, the MPC & Plain results are different?!')
    
    await mpc.shutdown()


if __name__ == '__main__':
    mpc.run(main())

