import secretsanta
from mpyc.runtime import mpc


async def main():
    """
    Runs the main function of the program, which executes the secretsanta module.
    """
    await secretsanta.main()


mpc.run(main())
