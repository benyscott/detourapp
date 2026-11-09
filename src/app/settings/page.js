'use client';

import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import SettingsForm from '@/components/SettingsForm';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function SettingsPage() {
    return (
        <div className="min-h-screen bg-background px-6 py-8 text-foreground sm:px-8">
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
                    <CardContent className="pt-6">
                        <SettingsForm />
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

