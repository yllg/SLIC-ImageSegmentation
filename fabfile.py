from fabric.api import env,local,run,sudo,put,cd,lcd,puts,task
from fabric.operations import local as lrun, run
from fabric.state import env
import os,sys,logging
logging.basicConfig(level=logging.INFO,
                    format='%(asctime)s %(name)-12s %(levelname)-8s %(message)s',
                    datefmt='%m-%d %H:%M',
                    filename='logs/fab.log',
                    filemode='a')

"""
Code no longer uses python.
"""



