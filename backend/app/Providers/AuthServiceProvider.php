<?php

namespace App\Providers;

use App\Models\Request;
use App\Policies\RequestPolicy;
use Illuminate\Foundation\Support\Providers\AuthServiceProvider as ServiceProvider;
use Illuminate\Support\Facades\Gate;

class AuthServiceProvider extends ServiceProvider
{
    /**
     * The policy mappings for the application.
     *
     * @var array<class-string, class-string>
     */
    protected $policies = [
        Request::class => RequestPolicy::class,
        // You can register other model policies here as needed
    ];

    /**
     * Register any authentication / authorization services.
     */
    public function boot(): void
    {
        $this->registerPolicies();

        // Optional: define gates for quick role checks
        Gate::define('isAdmin', fn($user) => $user->role === 'admin');
        Gate::define('isHospitalAdmin', fn($user) => $user->role === 'hospital_admin');
        Gate::define('isDispatcher', fn($user) => $user->role === 'dispatcher');
        Gate::define('isProcurement', fn($user) => $user->role === 'procurement');
        Gate::define('isLogistics', fn($user) => $user->role === 'logistics');
        Gate::define('isResponder', fn($user) => $user->role === 'responder');
        Gate::define('isPatient', fn($user) => $user->role === 'patient');
    }
}
