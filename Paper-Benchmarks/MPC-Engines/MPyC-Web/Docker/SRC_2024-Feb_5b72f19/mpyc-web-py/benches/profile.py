import cnnmnist as demo
from mpyc.runtime import mpc


async def main():
    """
    Runs the main function of the program, which executes the secretsanta module.
    """
    await demo.main()


global profile
profile = await prof(main)
