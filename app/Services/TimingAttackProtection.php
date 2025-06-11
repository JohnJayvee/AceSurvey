<?php

namespace App\Services;

class TimingAttackProtection
{
   private float $startTime;
   private float $minimumExecutionTime;

   public function __construct(float $minimumExecutionTime = 0.5)
   {
      $this->minimumExecutionTime = $minimumExecutionTime;
      $this->startTime = microtime(true);
   }

   public function protect(): void
   {
      $executionTime = microtime(true) - $this->startTime;

      if ($executionTime < $this->minimumExecutionTime) {
         usleep(($this->minimumExecutionTime - $executionTime) * 1000000);
      }
   }
}
