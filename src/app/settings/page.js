'use client';

import { useState } from 'react';
import Link from 'next/link';
import useSettingsStore from '@/store/settingsStore';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';

export default function SettingsPage() {
    const { searchRadius, setSearchRadius } = useSettingsStore();
    const [tempRadius, setTempRadius] = useState(searchRadius);

    const handleRadiusChange = ([value]) => {
        const newRadius = Number(value);
        setTempRadius(newRadius);
        setSearchRadius(newRadius);
    };

    const radiusKm = (tempRadius / 1000).toFixed(1);

    return (
        <div className="dark min-h-screen bg-background px-6 py-8 text-foreground sm:px-8">
            <div className="mx-auto flex w-full max-w-2xl flex-col gap-6">
                <Button asChild variant="ghost" className="w-fit">
                    <Link href="/">
                        <ArrowLeft />
                        Back
                    </Link>
                </Button>

                <header className="space-y-2">
                    <h1 className="text-3xl font-semibold tracking-tight">Settings</h1>
                    <p className="text-sm text-muted-foreground">
                        Adjust how far Detour searches for places around your current position.
                    </p>
                </header>

                <Card className="bg-card/80 backdrop-blur-sm">
                    <CardHeader>
                        <CardTitle>Search radius</CardTitle>
                        <CardDescription>
                            Limit search results to a radius around your live location.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between">
                            <Label htmlFor="search-radius">Radius</Label>
                            <span className="text-2xl font-semibold text-primary">{radiusKm} km</span>
                        </div>
                        <Slider
                            id="search-radius"
                            min={1000}
                            max={20000}
                            step={500}
                            value={[tempRadius]}
                            onValueChange={handleRadiusChange}
                        />
                        <div className="flex justify-between text-xs text-muted-foreground">
                            <span>1 km</span>
                            <span>20 km</span>
                        </div>
                        <p className="text-sm text-muted-foreground">
                            Smaller ranges return fewer results, but they are usually more relevant
                            to where you are right now.
                        </p>
                    </CardContent>
                </Card>

                <Card className="border-dashed bg-card/40">
                    <CardHeader>
                        <CardTitle>More settings coming soon</CardTitle>
                        <CardDescription>
                            Planned additions include theme preferences, location provider selection,
                            and metric or imperial unit toggles.
                        </CardDescription>
                    </CardHeader>
                </Card>
            </div>
        </div>
    );
}

